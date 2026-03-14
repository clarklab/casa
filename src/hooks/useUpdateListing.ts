import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ListingSummary } from '@/lib/types';

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      api.updateListing(id, {
        passcode: import.meta.env.VITE_PASSCODE || '1234',
        updates,
      }),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      await queryClient.cancelQueries({ queryKey: ['listing', id] });
      const prev = queryClient.getQueryData(['listings']) as { listings: ListingSummary[] } | undefined;
      const prevDetail = queryClient.getQueryData(['listing', id]) as Record<string, any> | undefined;
      // Helper: merge partial ratings into existing ratings, handling 0 as deletion
      const mergeRatings = (existing: Record<string, number> | undefined, partial: Record<string, number>) => {
        const merged = { ...(existing || {}) };
        for (const [name, value] of Object.entries(partial)) {
          if (value === 0) {
            delete merged[name];
          } else {
            merged[name] = value;
          }
        }
        return merged;
      };
      const recomputeAvg = (ratings: Record<string, number>) => {
        const vals = Object.values(ratings);
        return vals.length > 0
          ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
          : undefined;
      };
      if (prev) {
        queryClient.setQueryData(['listings'], {
          listings: prev.listings.map((l) => {
            if (l.id !== id) return l;
            const merged = { ...l, ...updates };
            if (updates.ratings) {
              merged.ratings = mergeRatings(l.ratings, updates.ratings as Record<string, number>);
              merged.rating = recomputeAvg(merged.ratings);
            }
            return merged;
          }),
        });
      }
      // Optimistically update the detail query so the rating sticks immediately.
      // Query data shape is { listing: { ...fields } } (before select extracts .listing).
      if (prevDetail) {
        const detail = prevDetail as { listing: Record<string, any> };
        const updatedListing = { ...detail.listing, ...updates };
        if (updates.ratings) {
          updatedListing.ratings = mergeRatings(detail.listing.ratings, updates.ratings as Record<string, number>);
          updatedListing.rating = recomputeAvg(updatedListing.ratings);
        }
        queryClient.setQueryData(['listing', id], {
          ...detail,
          listing: updatedListing,
        });
      }
      return { prev, prevDetail };
    },
    onError: (_err, { id }, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['listings'], context.prev);
      }
      if (context?.prevDetail) {
        queryClient.setQueryData(['listing', id], context.prevDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
}
