import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ScrapeRequest } from '@/lib/types';

export function useAddListing() {
  return useMutation({
    mutationFn: (data: ScrapeRequest) => api.scrape(data),
  });
}
