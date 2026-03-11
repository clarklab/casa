// ===== Shared Types Contract =====
// This file is the source of truth for data shapes.
// Server types in netlify/functions/lib/types.ts mirror these.

export interface Listing {
  id: string;
  createdAt: string;
  addedBy: string;
  sourceUrl: string;
  sourceSite: 'zillow' | 'redfin' | 'realtor' | 'other';

  // Core property data
  address: string;
  city: string;
  state: string;
  zip: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;

  // Specs
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSqft?: number;
  lotAcres?: number;
  yearBuilt?: number;
  stories?: number;
  garageSpaces?: number;
  hoaMonthly?: number | null;
  propertyType?: string;

  // Market data
  listDate?: string;
  daysOnMarket?: number;
  pricePerSqft?: number;
  zestimate?: number;
  status: string;

  // Images — keys into the "images" blob store
  imageKeys: string[];

  // User-generated
  notes: Note[];
  rating?: number;
  ratings?: Record<string, number>;
  tags: string[];
  isFavorited: boolean;
  isArchived: boolean;

  // Raw scraped data for debugging
  rawData?: Record<string, unknown>;
}

export interface Note {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface ListingSummary {
  id: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSqft?: number;
  lotAcres?: number;
  yearBuilt?: number;
  hoaMonthly?: number | null;
  daysOnMarket?: number;
  pricePerSqft?: number;
  status: string;
  latitude: number;
  longitude: number;
  isFavorited: boolean;
  isArchived: boolean;
  rating?: number;
  ratings?: Record<string, number>;
  tags: string[];
  imageKeys: string[];
  sourceSite: string;
  createdAt: string;
  addedBy: string;
  noteCount: number;
  latestNoteText?: string;
  propertyType?: string;
}

export interface ListingIndex {
  listings: ListingSummary[];
}

// API request/response types
export interface ScrapeRequest {
  url: string;
  addedBy: string;
  passcode: string;
}

export interface ScrapeResponse {
  success: boolean;
  listing?: ListingSummary;
  error?: 'SCRAPE_FAILED' | 'DUPLICATE_URL' | 'INVALID_PASSCODE' | 'UNSUPPORTED_SITE';
  message?: string;
}

export interface ListingsResponse {
  listings: ListingSummary[];
}

export interface ListingDetailResponse {
  listing: Listing;
}

export interface UpdateListingRequest {
  passcode: string;
  updates: Partial<Pick<Listing, 'rating' | 'ratings' | 'isFavorited' | 'isArchived' | 'tags' | 'status'>>;
}

export interface AddNoteRequest {
  listingId: string;
  text: string;
  author: string;
  passcode: string;
}

export interface AddNoteResponse {
  success: boolean;
  note?: Note;
}

export interface ManualListingRequest {
  passcode: string;
  addedBy: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSqft?: number;
  lotAcres?: number;
  yearBuilt?: number;
  propertyType?: string;
  hoaMonthly?: number | null;
  imageUrls?: string[];
  sourceUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface DeleteListingRequest {
  passcode: string;
}

// Turd detection — both Clark AND Angie rated ≤ 2
export function isTurd(listing: Pick<ListingSummary, 'ratings'>): boolean {
  const r = listing.ratings;
  if (!r) return false;
  const clark = r['Clark'];
  const angie = r['Angie'];
  return clark != null && angie != null && clark <= 2 && angie <= 2;
}

// Filter types
export interface FilterState {
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bathsMin?: number;
  sqftMin?: number;
  sqftMax?: number;
  lotMin?: number;
  lotMax?: number;
  yearMin?: number;
  yearMax?: number;
  statuses?: string[];
  hoaMax?: number | null; // null = no HOA only
  daysMax?: number;
  ratingMin?: number;
  tags?: string[];
}

export type SortField = 'createdAt' | 'price' | 'sqft' | 'pricePerSqft' | 'daysOnMarket' | 'rating' | 'distance';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}
