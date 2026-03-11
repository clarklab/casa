import { getListingsStore } from './blobs';
import type { Listing, ListingIndex, ListingSummary } from './types';

const INDEX_KEY = '_index';

export async function getIndex(): Promise<ListingIndex> {
  const store = getListingsStore();
  const data = await store.get(INDEX_KEY, { type: 'json' }).catch(() => null);
  return (data as ListingIndex) || { listings: [] };
}

export async function saveIndex(index: ListingIndex): Promise<void> {
  const store = getListingsStore();
  await store.setJSON(INDEX_KEY, index);
}

export function listingToSummary(listing: Listing): ListingSummary {
  return {
    id: listing.id,
    address: listing.address,
    city: listing.city,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    lotSqft: listing.lotSqft,
    lotAcres: listing.lotAcres,
    yearBuilt: listing.yearBuilt,
    hoaMonthly: listing.hoaMonthly,
    daysOnMarket: listing.daysOnMarket,
    pricePerSqft: listing.pricePerSqft,
    status: listing.status,
    latitude: listing.latitude,
    longitude: listing.longitude,
    isFavorited: listing.isFavorited,
    isArchived: listing.isArchived,
    rating: listing.ratings
      ? (() => {
          const vals = Object.values(listing.ratings);
          return vals.length > 0
            ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
            : listing.rating;
        })()
      : listing.rating,
    ratings: listing.ratings,
    tags: listing.tags,
    imageKeys: listing.imageKeys,
    sourceSite: listing.sourceSite,
    createdAt: listing.createdAt,
    addedBy: listing.addedBy,
    noteCount: listing.notes.length,
    latestNoteText: listing.notes.length > 0
      ? listing.notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].text
      : undefined,
    propertyType: listing.propertyType,
  };
}

export async function addListingToIndex(listing: Listing): Promise<void> {
  const index = await getIndex();
  const summary = listingToSummary(listing);
  // Remove existing entry if present (for updates)
  index.listings = index.listings.filter((l) => l.id !== listing.id);
  // Add to the front (newest first)
  index.listings.unshift(summary);
  await saveIndex(index);
}

export async function updateListingInIndex(
  id: string,
  updates: Partial<ListingSummary>
): Promise<void> {
  const index = await getIndex();
  const idx = index.listings.findIndex((l) => l.id === id);
  if (idx !== -1) {
    index.listings[idx] = { ...index.listings[idx], ...updates };
    await saveIndex(index);
  }
}

export async function removeListingFromIndex(id: string): Promise<void> {
  const index = await getIndex();
  index.listings = index.listings.filter((l) => l.id !== id);
  await saveIndex(index);
}
