import * as cheerio from 'cheerio';
import type { ParsedListingData, PhotoCandidate } from '../lib/types';

export function parseZillow(html: string, url: string): ParsedListingData {
  const $ = cheerio.load(html);

  // Zillow embeds data in __NEXT_DATA__
  const nextData = extractNextData($);
  if (!nextData) {
    // Fall back to JSON-LD
    return parseZillowJsonLd($, url);
  }

  return parseNextData(nextData);
}

function extractNextData($: cheerio.CheerioAPI): Record<string, any> | null {
  const script = $('script#__NEXT_DATA__');
  if (!script.length) return null;
  try {
    return JSON.parse(script.html() || '');
  } catch {
    return null;
  }
}

function parseNextData(nextData: Record<string, any>): ParsedListingData {
  // Navigate to the property data - Zillow structure varies
  const props = nextData?.props?.pageProps;
  const componentProps = props?.componentProps;
  const gdpClientCache = props?.gdpClientCache;

  let property: any = null;

  // Try gdpClientCache (common pattern)
  if (gdpClientCache) {
    try {
      const cache = typeof gdpClientCache === 'string' ? JSON.parse(gdpClientCache) : gdpClientCache;
      const firstKey = Object.keys(cache)[0];
      if (firstKey) {
        const parsed = typeof cache[firstKey] === 'string' ? JSON.parse(cache[firstKey]) : cache[firstKey];
        property = parsed?.property || parsed;
      }
    } catch {
      // continue to other methods
    }
  }

  // Try direct property path
  if (!property) {
    property = props?.property || componentProps?.property || {};
  }

  const address = property?.address || {};
  const photos: PhotoCandidate[] = [];

  // Extract photos
  const photoList = property?.photos || property?.responsivePhotos || property?.hugePhotos || [];
  for (const photo of photoList) {
    const url = photo?.url || photo?.mixedSources?.jpeg?.[photo?.mixedSources?.jpeg?.length - 1]?.url;
    if (url) {
      photos.push({
        url,
        caption: photo?.caption || '',
        tags: photo?.tags || [],
        width: photo?.width,
        height: photo?.height,
      });
    }
  }

  const price = property?.price || property?.listPrice || 0;
  const sqft = property?.livingArea || property?.livingAreaValue || 0;

  return {
    address: address?.streetAddress || '',
    city: address?.city || '',
    state: address?.state || '',
    zip: address?.zipcode || '',
    latitude: property?.latitude || 0,
    longitude: property?.longitude || 0,
    price,
    bedrooms: property?.bedrooms || 0,
    bathrooms: property?.bathrooms || 0,
    sqft,
    lotSqft: property?.lotSize || property?.lotAreaValue || undefined,
    lotAcres: property?.lotSize ? property.lotSize / 43560 : undefined,
    yearBuilt: property?.yearBuilt || undefined,
    propertyType: mapZillowPropertyType(property?.homeType),
    daysOnMarket: property?.daysOnZillow || undefined,
    pricePerSqft: sqft > 0 ? Math.round(price / sqft) : undefined,
    zestimate: property?.zestimate || undefined,
    status: mapZillowStatus(property?.homeStatus),
    photos,
    rawData: { zpid: property?.zpid },
  };
}

function parseZillowJsonLd($: cheerio.CheerioAPI, url: string): ParsedListingData {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() || '');
      if (data['@type'] === 'SingleFamilyResidence' || data['@type']?.includes?.('RealEstateListing')) {
        const address = data.address || {};
        const geo = data.geo || {};
        const photos: PhotoCandidate[] = [];
        const images = Array.isArray(data.image) ? data.image : data.image ? [data.image] : [];
        for (const img of images) {
          if (typeof img === 'string') photos.push({ url: img });
          else if (img?.url) photos.push({ url: img.url });
        }

        return {
          address: address.streetAddress || '',
          city: address.addressLocality || '',
          state: address.addressRegion || '',
          zip: address.postalCode || '',
          latitude: parseFloat(geo.latitude) || 0,
          longitude: parseFloat(geo.longitude) || 0,
          price: data.offers?.price || 0,
          bedrooms: data.numberOfRooms || 0,
          bathrooms: 0,
          sqft: data.floorSize?.value || 0,
          status: 'active',
          photos,
        };
      }
    } catch {
      continue;
    }
  }
  throw new Error('Could not extract Zillow listing data');
}

function mapZillowPropertyType(type?: string): string {
  if (!type) return 'single_family';
  const t = type.toLowerCase();
  if (t.includes('condo')) return 'condo';
  if (t.includes('townhouse')) return 'townhouse';
  if (t.includes('multi')) return 'multi_family';
  if (t.includes('land') || t.includes('lot')) return 'land';
  return 'single_family';
}

function mapZillowStatus(status?: string): string {
  if (!status) return 'active';
  const s = status.toLowerCase();
  if (s.includes('for_sale') || s.includes('active')) return 'active';
  if (s.includes('pending')) return 'pending';
  if (s.includes('sold') || s.includes('recently_sold')) return 'sold';
  return 'off_market';
}
