// Predefined name chips for the "Added by" selector
export const NAME_OPTIONS = ['Clark', 'Angie', 'Friends'] as const;

// Filter range defaults
export const FILTER_RANGES = {
  price: { min: 0, max: 2_000_000, step: 25_000 },
  sqft: { min: 0, max: 10_000, step: 100 },
  lot: { min: 0, max: 200_000, step: 1_000 }, // sqft
  year: { min: 1900, max: new Date().getFullYear(), step: 1 },
  beds: [1, 2, 3, 4, 5] as const,
  baths: [1, 1.5, 2, 2.5, 3, 4] as const,
  hoa: { max: 500, step: 50 },
  days: [7, 14, 30, 60, 90, 180] as const,
} as const;

// Property statuses
export const PROPERTY_STATUSES = ['active', 'pending', 'sold', 'off_market'] as const;

// Property types
export const PROPERTY_TYPES = [
  'single_family',
  'condo',
  'townhouse',
  'multi_family',
  'land',
  'other',
] as const;

// Sort options for display
export const SORT_OPTIONS = [
  { field: 'createdAt', label: 'Date Added' },
  { field: 'price', label: 'Price' },
  { field: 'distance', label: 'Distance' },
  { field: 'sqft', label: 'Sqft' },
  { field: 'pricePerSqft', label: 'Price/Sqft' },
  { field: 'daysOnMarket', label: 'Days Listed' },
  { field: 'rating', label: 'Rating' },
] as const;

// Passcode config
export const PASSCODE_LENGTH = 4;
export const AUTH_EXPIRY_DAYS = 30;

// TanStack Query polling interval (ms)
export const LISTINGS_POLL_INTERVAL = 30_000;

// Map defaults
export const DEFAULT_MAP_CENTER: [number, number] = [-97.7431, 30.2672]; // Austin, TX [lng, lat]
export const DEFAULT_MAP_ZOOM = 10;

// Friends location for distance calculation
export const FRIENDS_LOCATION = {
  label: 'Friends',
  latitude: 30.44037712666926,
  longitude: -97.68517179140501,
} as const;
