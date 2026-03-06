import { useState, useCallback, useMemo } from 'react';
import type { FilterState } from '@/lib/types';

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({});

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => {
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  const hasFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  return { filters, updateFilter, clearFilters, hasFilters };
}
