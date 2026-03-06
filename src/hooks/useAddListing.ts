import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ScrapeRequest, ListingsResponse } from '@/lib/types';

export function useAddListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScrapeRequest) => api.scrape(data),
    onSuccess: (result) => {
      console.log('[useAddListing] onSuccess fired', result);

      // Optimistically inject the new listing into the cache — the scrape
      // response already contains the full ListingSummary so we don't need
      // to wait for a refetch (which races against blob store consistency).
      if (result.success && result.listing) {
        queryClient.setQueryData<ListingsResponse>(['listings'], (old) => {
          const prev = old?.listings ?? [];
          // Avoid duplicates if the listing somehow already appeared
          if (prev.some((l) => l.id === result.listing!.id)) return old!;
          console.log('[useAddListing] injected listing into cache, new count:', prev.length + 1);
          return { listings: [result.listing!, ...prev] };
        });
      }

      // Delayed background refetch for eventual consistency with server.
      // After it completes, verify the optimistic listing survived — if the
      // server doesn't have it, something went wrong with the blob write.
      const optimisticId = result.listing?.id;
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['listings'] });
        if (optimisticId) {
          const fresh = queryClient.getQueryData<ListingsResponse>(['listings']);
          const found = fresh?.listings.some((l) => l.id === optimisticId);
          if (!found) {
            console.error(`[useAddListing] listing ${optimisticId} missing after refetch — server index may be stale`);
          }
        }
      }, 3000);
    },
  });
}
