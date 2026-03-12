import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getKnownListingIds, setKnownListingIds } from '@/lib/notifications';
import type { ScrapeRequest } from '@/lib/types';

export function useAddListing() {
  return useMutation({
    mutationFn: (data: ScrapeRequest) => api.scrape(data),
    onSuccess: (result) => {
      // Mark the new listing as "known" so the notification watcher
      // doesn't fire a notification for the user's own addition.
      if (result.listing) {
        const known = getKnownListingIds();
        known.add(result.listing.id);
        setKnownListingIds(known);
      }
    },
  });
}
