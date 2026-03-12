import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ListingSummary, ListingsResponse } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import {
  showNotification,
  getKnownListingIds,
  setKnownListingIds,
  getKnownNoteCounts,
  setKnownNoteCounts,
  getNotificationPermission,
} from '@/lib/notifications';

/**
 * Watches the listings query cache for changes and fires browser notifications
 * when new listings or notes appear that weren't added by the current user.
 */
export function useNotificationWatcher() {
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'success') return;

      const query = event.query;
      if (query.queryKey[0] !== 'listings') return;

      const data = query.state.data as ListingsResponse | undefined;
      if (!data?.listings) return;

      // Don't notify if permission not granted
      if (getNotificationPermission() !== 'granted') return;

      const listings = data.listings;
      const knownIds = getKnownListingIds();
      const knownNotes = getKnownNoteCounts();

      // On first load, just seed the known state — don't notify
      if (!initialized.current) {
        initialized.current = true;
        const allIds = new Set(listings.map((l) => l.id));
        setKnownListingIds(allIds);
        const counts: Record<string, number> = {};
        for (const l of listings) {
          counts[l.id] = l.noteCount;
        }
        setKnownNoteCounts(counts);
        return;
      }

      // Detect new listings
      const newListings: ListingSummary[] = [];
      for (const l of listings) {
        if (!knownIds.has(l.id)) {
          newListings.push(l);
        }
      }

      // Detect new notes
      const newNoteListings: ListingSummary[] = [];
      for (const l of listings) {
        const prev = knownNotes[l.id] ?? 0;
        if (l.noteCount > prev) {
          newNoteListings.push(l);
        }
      }

      // Update known state
      const updatedIds = new Set(listings.map((l) => l.id));
      setKnownListingIds(updatedIds);
      const updatedNotes: Record<string, number> = {};
      for (const l of listings) {
        updatedNotes[l.id] = l.noteCount;
      }
      setKnownNoteCounts(updatedNotes);

      // Fire notifications
      for (const l of newListings) {
        showNotification('New house added!', {
          body: `${l.address} — ${formatPrice(l.price)} | ${l.bedrooms}bd/${l.bathrooms}ba | Added by ${l.addedBy}`,
          url: `/listings/${l.id}`,
        });
      }

      for (const l of newNoteListings) {
        // Don't double-notify for brand new listings that also have notes
        if (newListings.some((nl) => nl.id === l.id)) continue;
        showNotification('New note on a listing', {
          body: `${l.address}${l.latestNoteText ? ': "' + l.latestNoteText + '"' : ''}`,
          url: `/listings/${l.id}`,
        });
      }
    });

    return unsubscribe;
  }, [queryClient]);
}
