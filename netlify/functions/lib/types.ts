// Server-side types — mirrors src/lib/types.ts
// Keep in sync with the client-side contract.

export interface Listing {
  id: string;
  createdAt: string;
  addedBy: string;
  sourceUrl: string;
  sourceSite: 'zillow' | 'redfin' | 'realtor' | 'other';

  address: string;
  city: string;
  state: string;
  zip: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;

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

  listDate?: string;
  daysOnMarket?: number;
  pricePerSqft?: number;
  zestimate?: number;
  status: string;

  imageKeys: string[];

  notes: Note[];
  rating?: number;
  ratings?: Record<string, number>;
  tags: string[];
  isFavorited: boolean;
  isArchived: boolean;

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
  propertyType?: string;
}

export interface ListingIndex {
  listings: ListingSummary[];
}

export interface ParsedListingData {
  address: string;
  city: string;
  state: string;
  zip: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
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
  listDate?: string;
  daysOnMarket?: number;
  pricePerSqft?: number;
  zestimate?: number;
  status: string;
  photos: PhotoCandidate[];
  rawData?: Record<string, unknown>;
}

export interface PhotoCandidate {
  url: string;
  caption?: string;
  tags?: string[];
  width?: number;
  height?: number;
}
