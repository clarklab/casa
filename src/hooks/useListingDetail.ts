import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useListingDetail(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.getListing(id),
    staleTime: 60_000,
    select: (data) => data.listing,
  });
}
