import { useState } from 'react';
import type { FilterState, SortField } from '@/lib/types';
import { BottomSheet } from './BottomSheet';
import { SORT_OPTIONS } from '@/lib/constants';
import { formatPrice } from '@/lib/format';

interface FilterBarProps {
  filters: FilterState;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  onToggleSort: (field: SortField) => void;
  totalCount: number;
  filteredCount: number;
}

export function FilterBar({
  filters, onUpdateFilter, onClearFilters, hasFilters,
  sortField, sortDirection, onToggleSort,
  totalCount, filteredCount,
}: FilterBarProps) {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const pillClass = (isActive: boolean) =>
    `flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
      isActive
        ? 'bg-casa-600 text-white'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
    }`;

  const icon = (name: string) => (
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{name}</span>
  );

  const SORT_ICONS: Record<string, string> = {
    createdAt: 'calendar_add_on',
    price: 'payments',
    distance: 'route',
    sqft: 'aspect_ratio',
    pricePerSqft: 'payments',
    daysOnMarket: 'calendar_add_on',
    rating: 'family_star',
  };

  return (
    <>
      <div className="sticky top-[53px] z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
        <div className="relative">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {/* Sort */}
          <button onClick={() => setActiveSheet('sort')} className={pillClass(sortField !== 'price')}>
            {icon(SORT_ICONS[sortField] || 'sort')} {SORT_OPTIONS.find((o) => o.field === sortField)?.label || 'Sort'} {sortDirection === 'asc' ? '↑' : '↓'}
          </button>

          {/* Distance */}
          <button
            onClick={() => onToggleSort('distance' as SortField)}
            className={pillClass(sortField === 'distance')}
          >
            {icon('route')} Distance {sortField === 'distance' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>

          {/* Price */}
          <button onClick={() => setActiveSheet('price')} className={pillClass(!!(filters.priceMin || filters.priceMax))}>
            {icon('payments')} {filters.priceMin || filters.priceMax
              ? `${filters.priceMin ? formatPrice(filters.priceMin) : '$0'}–${filters.priceMax ? formatPrice(filters.priceMax) : 'Any'}`
              : 'Price'}
          </button>

          {/* Beds */}
          <button onClick={() => setActiveSheet('beds')} className={pillClass(!!filters.bedsMin)}>
            {icon('king_bed')} {filters.bedsMin ? `${filters.bedsMin}+ Beds` : 'Beds'}
          </button>

          {/* Baths */}
          <button onClick={() => setActiveSheet('baths')} className={pillClass(!!filters.bathsMin)}>
            {icon('wc')} {filters.bathsMin ? `${filters.bathsMin}+ Baths` : 'Baths'}
          </button>

          {/* Sqft */}
          <button onClick={() => setActiveSheet('sqft')} className={pillClass(!!(filters.sqftMin || filters.sqftMax))}>
            {icon('aspect_ratio')} Sqft
          </button>

          {/* Rating */}
          <button onClick={() => setActiveSheet('rating')} className={pillClass(!!filters.ratingMin)}>
            {icon('family_star')} {filters.ratingMin ? `${filters.ratingMin}+` : 'Rating'}
          </button>

          {/* Clear */}
          {hasFilters && (
            <button onClick={onClearFilters} className="flex-shrink-0 px-3.5 py-1.5 text-sm text-red-500 font-medium whitespace-nowrap">
              Clear
            </button>
          )}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-slate-50/80 dark:from-slate-950/80 to-transparent" />
        </div>

        {/* Count */}
        {hasFilters && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            Showing {filteredCount} of {totalCount} homes
          </p>
        )}
      </div>

      {/* Sort sheet */}
      <BottomSheet isOpen={activeSheet === 'sort'} onClose={() => setActiveSheet(null)} title="Sort By">
        <div className="space-y-1 pt-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.field}
              onClick={() => { onToggleSort(opt.field as SortField); setActiveSheet(null); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                sortField === opt.field
                  ? 'bg-casa-50 dark:bg-casa-900/20 text-casa-700 dark:text-casa-300 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label} {sortField === opt.field && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Price sheet */}
      <BottomSheet isOpen={activeSheet === 'price'} onClose={() => setActiveSheet(null)} title="Price Range">
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Min Price</label>
              <input
                type="number"
                value={filters.priceMin || ''}
                onChange={(e) => onUpdateFilter('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="$0"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-casa-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Max Price</label>
              <input
                type="number"
                value={filters.priceMax || ''}
                onChange={(e) => onUpdateFilter('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Any"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-casa-500"
              />
            </div>
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Under $300k', min: undefined, max: 300000 },
              { label: '$300k–$500k', min: 300000, max: 500000 },
              { label: '$500k–$750k', min: 500000, max: 750000 },
              { label: '$750k+', min: 750000, max: undefined },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  onUpdateFilter('priceMin', p.min);
                  onUpdateFilter('priceMax', p.max);
                  setActiveSheet(null);
                }}
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* Beds sheet */}
      <BottomSheet isOpen={activeSheet === 'beds'} onClose={() => setActiveSheet(null)} title="Bedrooms">
        <div className="flex gap-2 pt-2">
          {[undefined, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n ?? 'any'}
              onClick={() => { onUpdateFilter('bedsMin', n); setActiveSheet(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                filters.bedsMin === n
                  ? 'bg-casa-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {n ? `${n}+` : 'Any'}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Baths sheet */}
      <BottomSheet isOpen={activeSheet === 'baths'} onClose={() => setActiveSheet(null)} title="Bathrooms">
        <div className="flex gap-2 pt-2">
          {[undefined, 1, 2, 3, 4].map((n) => (
            <button
              key={n ?? 'any'}
              onClick={() => { onUpdateFilter('bathsMin', n); setActiveSheet(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                filters.bathsMin === n
                  ? 'bg-casa-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {n ? `${n}+` : 'Any'}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Sqft sheet */}
      <BottomSheet isOpen={activeSheet === 'sqft'} onClose={() => setActiveSheet(null)} title="Square Feet">
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Min Sqft</label>
              <input
                type="number"
                value={filters.sqftMin || ''}
                onChange={(e) => onUpdateFilter('sqftMin', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-casa-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Max Sqft</label>
              <input
                type="number"
                value={filters.sqftMax || ''}
                onChange={(e) => onUpdateFilter('sqftMax', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Any"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-casa-500"
              />
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Rating sheet */}
      <BottomSheet isOpen={activeSheet === 'rating'} onClose={() => setActiveSheet(null)} title="Minimum Rating">
        <div className="flex gap-2 pt-2">
          {[undefined, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n ?? 'any'}
              onClick={() => { onUpdateFilter('ratingMin', n); setActiveSheet(null); }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                filters.ratingMin === n
                  ? 'bg-casa-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {n ? `${n}★` : 'Any'}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
