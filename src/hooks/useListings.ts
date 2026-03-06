import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LISTINGS_POLL_INTERVAL } from '@/lib/constants';

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: () => {
      console.log('[useListings] fetching listings...');
      return api.getListings().then((data) => {
        console.log('[useListings] got', data.listings.length, 'listings');
        return data;
      });
    },
    refetchInterval: LISTINGS_POLL_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    select: (data) => data.listings,
  });
}
