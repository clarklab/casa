import type { ListingSummary, FilterState } from './types';

export function applyFilters(listings: ListingSummary[], filters: FilterState): ListingSummary[] {
  return listings.filter((l) => {
    if (filters.priceMin && l.price < filters.priceMin) return false;
    if (filters.priceMax && l.price > filters.priceMax) return false;
    if (filters.bedsMin && l.bedrooms < filters.bedsMin) return false;
    if (filters.bathsMin && l.bathrooms < filters.bathsMin) return false;
    if (filters.sqftMin && l.sqft < filters.sqftMin) return false;
    if (filters.sqftMax && l.sqft > filters.sqftMax) return false;
    if (filters.lotMin && (l.lotSqft || 0) < filters.lotMin) return false;
    if (filters.lotMax && (l.lotSqft || 0) > filters.lotMax) return false;
    if (filters.yearMin && (l.yearBuilt || 0) < filters.yearMin) return false;
    if (filters.yearMax && (l.yearBuilt || 9999) > filters.yearMax) return false;
    if (filters.statuses?.length && !filters.statuses.includes(l.status)) return false;
    if (filters.hoaMax === null && l.hoaMonthly !== null) return false; // no HOA only
    if (typeof filters.hoaMax === 'number' && (l.hoaMonthly || 0) > filters.hoaMax) return false;
    if (filters.daysMax && (l.daysOnMarket || 0) > filters.daysMax) return false;
    if (filters.ratingMin && (l.rating || 0) < filters.ratingMin) return false;
    if (filters.tags?.length && !filters.tags.some((t) => l.tags.includes(t))) return false;
    return true;
  });
}

export function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  if (filters.priceMin || filters.priceMax) count++;
  if (filters.bedsMin) count++;
  if (filters.bathsMin) count++;
  if (filters.sqftMin || filters.sqftMax) count++;
  if (filters.lotMin || filters.lotMax) count++;
  if (filters.yearMin || filters.yearMax) count++;
  if (filters.statuses?.length) count++;
  if (filters.hoaMax !== undefined) count++;
  if (filters.daysMax) count++;
  if (filters.ratingMin) count++;
  if (filters.tags?.length) count++;
  return count;
}
