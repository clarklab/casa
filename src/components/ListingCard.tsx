import { useNavigate } from '@tanstack/react-router';
import type { ListingSummary } from '@/lib/types';
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
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
      style={isNew ? {
        animation: 'cardReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both, glowPulse 0.6s ease-out 0.35s both',
        willChange: 'transform, opacity, box-shadow',
      } : undefined}
    >
      {/* Image carousel */}
      <ImageCarousel
        imageKeys={listing.imageKeys}
        alt={listing.address}
        className="aspect-[16/10]"
        viewTransitionName={`listing-image-${listing.id}`}
      />

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
            <span className="ml-auto text-casa-600 dark:text-casa-400 font-medium">
              📝 {listing.noteCount} note{listing.noteCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
