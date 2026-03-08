import { useState, useCallback } from 'react';
import { type SortField, type SortDirection, type ListingSummary, isTurd } from '@/lib/types';
import { haversineDistance } from '@/lib/geo';
import { FRIENDS_LOCATION } from '@/lib/constants';

export function useSort() {
  const [field, setField] = useState<SortField>('price');
  const [direction, setDirection] = useState<SortDirection>('desc');

  const toggleSort = useCallback((newField: SortField) => {
    if (newField === field) {
      setDirection((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setField(newField);
      setDirection(newField === 'distance' ? 'asc' : 'desc');
    }
  }, [field]);

  const sortListings = useCallback(
    (listings: ListingSummary[]) => {
      return [...listings].sort((a, b) => {
        // Turds always sink to the bottom
        const aTurd = isTurd(a);
        const bTurd = isTurd(b);
        if (aTurd !== bTurd) return aTurd ? 1 : -1;

        let aVal: number;
        let bVal: number;

        switch (field) {
          case 'price':
            aVal = a.price;
            bVal = b.price;
            break;
          case 'sqft':
            aVal = a.sqft;
            bVal = b.sqft;
            break;
          case 'pricePerSqft':
            aVal = a.pricePerSqft || 0;
            bVal = b.pricePerSqft || 0;
            break;
          case 'daysOnMarket':
            aVal = a.daysOnMarket || 0;
            bVal = b.daysOnMarket || 0;
            break;
          case 'rating':
            aVal = a.rating || 0;
            bVal = b.rating || 0;
            break;
          case 'distance':
            aVal = a.latitude && a.longitude ? haversineDistance(a.latitude, a.longitude, FRIENDS_LOCATION.latitude, FRIENDS_LOCATION.longitude) : Infinity;
            bVal = b.latitude && b.longitude ? haversineDistance(b.latitude, b.longitude, FRIENDS_LOCATION.latitude, FRIENDS_LOCATION.longitude) : Infinity;
            break;
          case 'createdAt':
          default:
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
        }

        return direction === 'desc' ? bVal - aVal : aVal - bVal;
      });
    },
    [field, direction]
  );

  return { field, direction, toggleSort, sortListings };
}
