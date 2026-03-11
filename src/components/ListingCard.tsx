import { useNavigate } from '@tanstack/react-router';
import { type ListingSummary, isTurd } from '@/lib/types';
import { formatPriceFull, formatSqft, formatDaysOnMarket, formatDistance } from '@/lib/format';
import { haversineDistance } from '@/lib/geo';
import { FRIENDS_LOCATION } from '@/lib/constants';
import { ImageCarousel } from './ImageCarousel';
import { RatingStars } from './RatingStars';

interface ListingCardProps {
  listing: ListingSummary;
  isNew?: boolean;
}

export function ListingCard({ listing, isNew }: ListingCardProps) {
  const navigate = useNavigate();
  const turd = isTurd(listing);

  const statusBadge = listing.status !== 'active' ? (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
      listing.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : listing.status === 'sold' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    }`}>
      {listing.status === 'pending' ? 'Pending' : listing.status === 'sold' ? 'Sold' : 'Off Market'}
    </span>
  ) : null;

  const daysText = formatDaysOnMarket(listing.daysOnMarket);
  const distToFriends = listing.latitude && listing.longitude
    ? haversineDistance(listing.latitude, listing.longitude, FRIENDS_LOCATION.latitude, FRIENDS_LOCATION.longitude)
    : null;

  return (
    <div
      onClick={() => navigate({ to: '/listings/$id', params: { id: listing.id } })}
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden active:scale-[0.99] transition-transform cursor-pointer${turd ? ' opacity-50 grayscale-[40%]' : ''}`}
      style={isNew ? {
        animation: 'cardReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both, glowPulse 0.6s ease-out 0.35s both',
        willChange: 'transform, opacity, box-shadow',
      } : undefined}
    >
      {/* Image carousel + turd overlays */}
      <div className="relative">
        <ImageCarousel
          imageKeys={listing.imageKeys}
          alt={listing.address}
          className="aspect-[16/10]"
          viewTransitionName={`listing-image-${listing.id}`}
          maxDots={7}
          autoPlayInterval={0}
        />
        {listing.latestNoteText && (
          <div className="absolute bottom-2 right-2 z-10 max-w-[60%] pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] leading-tight px-2 py-1 rounded-lg truncate">
              {listing.latestNoteText}
            </div>
          </div>
        )}
        {turd && (
          <>
            {/* Big poop emoji over the image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-7xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>💩</span>
            </div>
            {/* Postal stamp "TURD" */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ animation: 'turdStamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
              <div className="turd-stamp">
                TURD
              </div>
            </div>
          </>
        )}
      </div>

      {/* Card content */}
      <div className="p-3.5">
        {/* Price + favorite + rating row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {formatPriceFull(listing.price)}
            </span>
            {statusBadge}
          </div>
          <RatingStars rating={listing.rating} />
        </div>

        {/* Address */}
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
          {listing.address}, {listing.city}
        </p>

        {/* Specs */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          {listing.bedrooms} bd · {listing.bathrooms} ba · {formatSqft(listing.sqft)}
        </p>

        {/* Secondary info */}
        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          {distToFriends !== null && <span>{formatDistance(distToFriends)} to friends</span>}
          {daysText && <span>{daysText}</span>}
          {listing.pricePerSqft && <span>${listing.pricePerSqft}/sqft</span>}
          {listing.yearBuilt && <span>{listing.yearBuilt}</span>}
          {listing.noteCount > 0 && (
            <span className="ml-auto text-casa-600 dark:text-casa-400 font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>note_stack</span>
              {listing.noteCount} note{listing.noteCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
