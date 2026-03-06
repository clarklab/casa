import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ScrapeRequest } from '@/lib/types';

export function useAddListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScrapeRequest) => api.scrape(data),
    onSuccess: (result) => {
      console.log('[useAddListing] onSuccess fired, invalidating listings query', result);
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
