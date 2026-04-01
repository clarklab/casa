import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getKnownNoteCounts, setKnownNoteCounts } from '@/lib/notifications';
import type { AddNoteRequest, ListingSummary } from '@/lib/types';

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddNoteRequest) => api.addNote(data),
    onSuccess: (data, variables) => {
      // Bump the known note count so the watcher doesn't notify for our own note
      const counts = getKnownNoteCounts();
      counts[variables.listingId] = (counts[variables.listingId] ?? 0) + 1;
      setKnownNoteCounts(counts);

      if (data.note) {
        // Optimistically update the detail query
        const prevDetail = queryClient.getQueryData(['listing', variables.listingId]) as { listing: Record<string, any> } | undefined;
        if (prevDetail) {
          queryClient.setQueryData(['listing', variables.listingId], {
            ...prevDetail,
            listing: {
              ...prevDetail.listing,
              notes: [...(prevDetail.listing.notes || []), data.note],
            },
          });
        }

        // Optimistically update the listings query (noteCount and latestNoteText)
        const prev = queryClient.getQueryData(['listings']) as { listings: ListingSummary[] } | undefined;
        if (prev) {
          queryClient.setQueryData(['listings'], {
            listings: prev.listings.map((l) => {
              if (l.id !== variables.listingId) return l;
              return {
                ...l,
                noteCount: (l.noteCount || 0) + 1,
                latestNoteText: data.note!.text,
              };
            }),
          });
        }
      }

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['listing', variables.listingId] });
        queryClient.invalidateQueries({ queryKey: ['listings'] });
      }, 2000);
    },
  });
}
