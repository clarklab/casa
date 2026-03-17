import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useListingDetail } from '@/hooks/useListingDetail';
import { useUpdateListing } from '@/hooks/useUpdateListing';
import { useDeleteListing } from '@/hooks/useDeleteListing';
import { ImageCarousel } from '@/components/ImageCarousel';
import { RatingStars } from '@/components/RatingStars';
import { formatPriceFull, formatLotSize, formatDaysOnMarket, formatDate, formatRelativeDate } from '@/lib/format';
import { useState } from 'react';
import { useAddNote } from '@/hooks/useAddNote';
import { useAuth } from '@/hooks/useAuth';
import { NAME_OPTIONS } from '@/lib/constants';
import { FriendsDistanceCard } from '@/components/FriendsDistanceCard';

export const Route = createFileRoute('/_app/listings_/$id')({
  component: ListingDetailPage,
});

function ListingDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: listing, isLoading } = useListingDetail(id);
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const addNote = useAddNote();
  const { getLastName, setLastName, getPasscode } = useAuth();

  const [noteText, setNoteText] = useState('');
  const [noteName, setNoteName] = useState(getLastName() || NAME_OPTIONS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white dark:bg-slate-950 animate-pulse">
        <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800" />
        <div className="p-4 space-y-3">
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-40" />
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-56" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-dvh bg-white dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500">Listing not found</p>
      </div>
    );
  }

  const handleRating = (name: string, value: number) => {
    // Send only the changed rating — server merges atomically with existing ratings.
    // Value of 0 tells the server to delete that person's rating.
    updateListing.mutate({ id, updates: { ratings: { [name]: value } } });
  };

  const handleDelete = async () => {
    await deleteListing.mutateAsync(id);
    navigate({ to: '/listings' });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setLastName(noteName);
    await addNote.mutateAsync({
      listingId: id,
      text: noteText.trim(),
      author: noteName,
      passcode: getPasscode(),
    });
    setNoteText('');
  };

  const lotText = formatLotSize(listing.lotSqft, listing.lotAcres);
  const daysText = formatDaysOnMarket(listing.daysOnMarket);
  const sortedNotes = [...listing.notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-dvh bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between safe-area-top">
        <button
          onClick={() => navigate({ to: '/listings' })}
          className="text-casa-600 dark:text-casa-400 font-medium text-sm flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        {listing.sourceUrl && (
          <a
            href={listing.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-casa-600 text-white text-sm font-medium rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </a>
        )}
      </header>

      {/* Image carousel */}
      <ImageCarousel
        imageKeys={listing.imageKeys}
        alt={listing.address}
        className="aspect-[16/10]"
        viewTransitionName={`listing-image-${listing.id}`}
      />

      <div className="p-4 space-y-5">
        {/* Price + status */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatPriceFull(listing.price)}
            </span>
            {listing.status !== 'active' && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                listing.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                : listing.status === 'sold' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {listing.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-base text-slate-700 dark:text-slate-300">{listing.address}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {listing.city}, {listing.state} {listing.zip}
          </p>
        </div>

        {/* Per-person ratings */}
        <div className="space-y-2">
          {NAME_OPTIONS.map((name) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-12">{name}</span>
              <RatingStars
                rating={listing.ratings?.[name] || 0}
                onChange={(v) => handleRating(name, v)}
                size="md"
              />
            </div>
          ))}
          {(() => {
            const vals = Object.values(listing.ratings || {});
            if (vals.length === 0) return null;
            const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
            return (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-12">Avg</span>
                <div className="flex items-center gap-1.5">
                  <RatingStars rating={Math.round(avg)} size="md" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{avg}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Key specs */}
        <div className="grid grid-cols-3 gap-3">
          <SpecBox label="Beds" value={String(listing.bedrooms)} />
          <SpecBox label="Baths" value={String(listing.bathrooms)} />
          <SpecBox label="Sqft" value={listing.sqft.toLocaleString()} />
        </div>

        {/* All specs */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-2.5">
          {listing.pricePerSqft && <SpecRow label="Price/sqft" value={`$${listing.pricePerSqft}`} />}
          {lotText && <SpecRow label="Lot size" value={lotText} />}
          {listing.yearBuilt && <SpecRow label="Year built" value={String(listing.yearBuilt)} />}
          {listing.stories && <SpecRow label="Stories" value={String(listing.stories)} />}
          {listing.garageSpaces && <SpecRow label="Garage" value={`${listing.garageSpaces} spaces`} />}
          {listing.hoaMonthly !== undefined && listing.hoaMonthly !== null && (
            <SpecRow label="HOA" value={`$${listing.hoaMonthly}/mo`} />
          )}
          {listing.hoaMonthly === null && <SpecRow label="HOA" value="None" />}
          {listing.propertyType && <SpecRow label="Type" value={listing.propertyType.replace(/_/g, ' ')} />}
          {daysText && <SpecRow label="Days listed" value={daysText} />}
          {listing.listDate && <SpecRow label="List date" value={formatDate(listing.listDate)} />}
          {listing.zestimate && <SpecRow label="Zestimate" value={formatPriceFull(listing.zestimate)} />}
          <SpecRow label="Added by" value={listing.addedBy} />
          <SpecRow label="Added" value={formatDate(listing.createdAt)} />
        </div>

        {/* Distance to friends */}
        {listing.latitude && listing.longitude && (
          <FriendsDistanceCard latitude={listing.latitude} longitude={listing.longitude} />
        )}

        {/* Tags */}
        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-casa-50 dark:bg-casa-900/20 text-casa-700 dark:text-casa-300 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Notes section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Notes ({listing.notes.length})
            </h3>
          </div>

          {/* Name picker */}
          <div className="flex gap-2 mb-2">
            {NAME_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => { setNoteName(n); setLastName(n); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  noteName === n
                    ? 'bg-casa-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Add note inline */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-casa-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim() || addNote.isPending}
              className="px-4 py-2.5 bg-casa-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Post
            </button>
          </div>

          {/* Notes list */}
          {sortedNotes.length > 0 && (
            <div className="space-y-3">
              {sortedNotes.map((note) => (
                <div key={note.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl px-3.5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {note.author}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatRelativeDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source link */}
        {listing.sourceUrl && (
          <a
            href={listing.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-3 text-casa-600 dark:text-casa-400 text-sm font-medium"
          >
            View on {listing.sourceSite.charAt(0).toUpperCase() + listing.sourceSite.slice(1)} →
          </a>
        )}

        {/* Delete */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleteListing.isPending}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold"
              >
                {deleteListing.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-red-500 text-sm font-medium"
            >
              Delete Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-white font-medium">{value}</span>
    </div>
  );
}
