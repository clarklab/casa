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
      const prev = queryClient.getQueryData(['listings']) as { listings: ListingSummary[] } | undefined;
      if (prev) {
        queryClient.setQueryData(['listings'], {
          listings: prev.listings.map((l) => {
            if (l.id !== id) return l;
            const merged = { ...l, ...updates };
            // Recompute average rating for optimistic cache
            if (updates.ratings) {
              const vals = Object.values(updates.ratings as Record<string, number>);
              if (vals.length > 0) {
                merged.rating = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
              }
            }
            return merged;
          }),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['listings'], context.prev);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
}
