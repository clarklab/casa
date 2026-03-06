import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useListings } from '@/hooks/useListings';
import { useAddListing } from '@/hooks/useAddListing';
import { useFilters } from '@/hooks/useFilters';
import { useSort } from '@/hooks/useSort';
import { applyFilters } from '@/lib/filters';
import { ListingCard } from '@/components/ListingCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { AddListingSheet } from '@/components/AddListingSheet';
import { AddListingProgressModal } from '@/components/AddListingProgressModal';
import { FilterBar } from '@/components/FilterBar';
import type { ScrapeRequest, ScrapeResponse } from '@/lib/types';

export const Route = createFileRoute('/_app/listings')({
  component: ListingsPage,
});

function ListingsPage() {
  const navigate = useNavigate();
  const { data: listings, isLoading } = useListings();
  const addListing = useAddListing();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const { filters, updateFilter, clearFilters, hasFilters } = useFilters();
  const { field, direction, toggleSort, sortListings } = useSort();

  const [progressModal, setProgressModal] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    result?: ScrapeResponse;
    errorMessage?: string;
    pendingData?: ScrapeRequest;
  }>({ isOpen: false, status: 'loading' });

  const handleAddSubmit = async (data: ScrapeRequest) => {
    setProgressModal({ isOpen: true, status: 'loading', pendingData: data });

    try {
      const result = await addListing.mutateAsync(data);
      if (result.success) {
        setProgressModal((prev) => ({ ...prev, status: 'success', result }));
      } else {
        setProgressModal((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: result.message || 'Failed to add listing',
        }));
      }
    } catch (err: any) {
      setProgressModal((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Failed to add listing',
      }));
    }
  };

  const handleRetry = () => {
    if (progressModal.pendingData) {
      handleAddSubmit(progressModal.pendingData);
    }
  };

  const handleProgressClose = () => {
    setProgressModal({ isOpen: false, status: 'loading' });
  };

  const activeListings = useMemo(() => {
    const base = listings?.filter((l) => !l.isArchived) || [];
    const filtered = applyFilters(base, filters);
    return sortListings(filtered);
  }, [listings, filters, sortListings]);

  const totalCount = listings?.filter((l) => !l.isArchived).length || 0;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between safe-area-top">
        <h1 className="text-xl font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" height="22" viewBox="0 -960 960 960" width="22" fill="currentColor"><path d="M80-200v-360l160-160h40v-80h80v80h360l160 160v360H80Zm560-80h160v-247l-80-80-80 80v247Zm-480 0h400v-200H160v200Z"/></svg>
          <span className="text-casa-600 dark:text-casa-400">Casa</span>
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate({ to: '/map' })}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Map view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </button>
          <button
            onClick={() => setShowAddSheet(true)}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Add listing"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Filter bar */}
      {!isLoading && totalCount > 0 && (
        <FilterBar
          filters={filters}
          onUpdateFilter={updateFilter}
          onClearFilters={clearFilters}
          hasFilters={hasFilters}
          sortField={field}
          sortDirection={direction}
          onToggleSort={toggleSort}
          totalCount={totalCount}
          filteredCount={activeListings.length}
        />
      )}

      {/* Card stack */}
      <div className="px-4 py-4 space-y-4 pb-8">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : activeListings.length === 0 && totalCount > 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              No homes match your filters
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 bg-casa-600 text-white font-medium rounded-xl text-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : activeListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No homes saved yet
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Tap + to add your first listing
            </p>
            <button
              onClick={() => setShowAddSheet(true)}
              className="px-6 py-3 bg-casa-600 hover:bg-casa-700 text-white font-semibold rounded-xl transition-colors"
            >
              Add a Home
            </button>
          </div>
        ) : (
          activeListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        )}
      </div>

      <AddListingSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onSubmit={handleAddSubmit}
      />

      <AddListingProgressModal
        isOpen={progressModal.isOpen}
        status={progressModal.status}
        result={progressModal.result}
        errorMessage={progressModal.errorMessage}
        onClose={handleProgressClose}
        onRetry={handleRetry}
      />
    </div>
  );
}
