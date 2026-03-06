import * as cheerio from 'cheerio';
import type { ParsedListingData, PhotoCandidate } from '../lib/types';
import { fetchRedfinApi } from './utils/fetch';

/**
 * Parse Redfin listing from full HTML (via ScrapingBee or direct fetch).
 */
export function parseRedfin(html: string, url: string): ParsedListingData {
  const $ = cheerio.load(html);

  // Try JSON-LD first (most reliable and simplest)
  const jsonLdData = extractJsonLd($);
  // Try reactServerState for richer data
  const serverState = extractReactServerState(html);

  if (!jsonLdData && !serverState) {
    throw new Error('Could not extract listing data from Redfin page');
  }

  return mergeData(jsonLdData, serverState, $, url);
}

/**
 * Parse Redfin listing using only the public stingray API (no HTML needed).
 * This is a fallback when ScrapingBee is not configured.
 * Gets core data from the AVM endpoint + constructs photo URLs.
 */
export async function parseRedfinFromApi(url: string): Promise<ParsedListingData> {
  // Extract propertyId from URL: /home/{propertyId}
  const propertyIdMatch = url.match(/\/home\/(\d+)/);
  if (!propertyIdMatch) {
    throw new Error('Could not extract property ID from Redfin URL');
  }
  const propertyId = propertyIdMatch[1];

  // Fetch AVM data (works without cookies)
  const avm = await fetchRedfinApi('avm', { propertyId, accessLevel: '1' });
  if (!avm) {
    throw new Error('Redfin AVM API returned no data');
  }

  // Fetch tour insights for listingId
  const tour = await fetchRedfinApi('tourInsights', { propertyId, accessLevel: '1' });
  const listingId = tour?.primaryListingId?.toString();

  const streetAddress = avm.streetAddress?.assembledAddress || '';
  const price = avm.priceInfo?.amount || 0;
  const beds = avm.numBeds || 0;
  const baths = avm.numBaths || 0;
  const sqft = avm.sqFt?.value || 0;
  const lat = avm.latLong?.latitude || 0;
  const lng = avm.latLong?.longitude || 0;
  const dataSourceId = avm.priceInfo?.dataSourceId;

  // Try to extract city/state/zip from the URL path: /TX/Jonestown/...
  const urlParts = new URL(url).pathname.split('/').filter(Boolean);
  const state = urlParts[0] || '';
  const city = urlParts[1]?.replace(/-/g, ' ') || '';
  // Zip from the address part: 18208-Gregg-Bluff-Rd-78645
  const zipMatch = urlParts[2]?.match(/(\d{5})$/);
  const zip = zipMatch?.[1] || '';

  // Build photo URLs from comparables pattern (best effort)
  // Redfin CDN photo URL pattern: https://ssl.cdn-redfin.com/photo/{dataSourceId}/bigphoto/{subdir}/{mlsId}_{index}.jpg
  // We can't get the mlsId from the API, so use comparables' primary photos as fallback
  const photos: PhotoCandidate[] = [];
  if (avm.comparables?.length) {
    // Use 4 comparable property photos as a placeholder
    for (const comp of avm.comparables.slice(0, 4)) {
      if (comp.primaryPhotoDisplayLevel === 1 && comp.availablePhotos) {
        const compMlsId = comp.mlsId;
        const compDsId = comp.dataSourceId || dataSourceId;
        if (compMlsId && compDsId) {
          const subdir = compMlsId.slice(-3);
          const photoUrl = `https://ssl.cdn-redfin.com/photo/${compDsId}/bigphoto/${subdir}/${compMlsId}_0.jpg`;
          photos.push({ url: photoUrl, caption: `Comparable: ${comp.entireAddressString || ''}` });
        }
      }
    }
  }

  return {
    address: streetAddress,
    city,
    state,
    zip,
    latitude: lat,
    longitude: lng,
    price,
    bedrooms: beds,
    bathrooms: baths,
    sqft,
    pricePerSqft: sqft > 0 ? Math.round(price / sqft) : undefined,
    status: avm.isActivish ? 'active' : 'off_market',
    photos,
    rawData: { propertyId, listingId, dataSourceId, source: 'api_only' },
  };
}

function extractJsonLd($: cheerio.CheerioAPI): Record<string, any> | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const text = $(scripts[i]).html();
      if (!text) continue;
      const data = JSON.parse(text);
      if (
        data['@type'] &&
        (Array.isArray(data['@type'])
          ? data['@type'].includes('RealEstateListing')
          : data['@type'] === 'RealEstateListing')
      ) {
        return data;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function extractReactServerState(html: string): Record<string, any> | null {
  const patterns = [
    /root\.__reactServerState\.InitialContext\s*=\s*(\{[\s\S]*?\});/,
    /__reactServerState\.InitialContext\s*=\s*(\{[\s\S]*?\});/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const context = JSON.parse(match[1]);
        const cache = context?.['ReactServerAgent.cache']?.dataCache;
        if (!cache) return null;

        const result: Record<string, any> = {};
        for (const [key, entry] of Object.entries(cache)) {
          const e = entry as any;
          if (e?.res?.text) {
            try {
              let text = e.res.text;
              if (text.startsWith('{}&&')) text = text.slice(4);
              result[key] = JSON.parse(text);
            } catch { /* skip */ }
          }
        }
        return result;
      } catch { continue; }
    }
  }
  return null;
}

function findEndpoint(serverState: Record<string, any> | null, endpoint: string): any {
  if (!serverState) return null;
  for (const [key, value] of Object.entries(serverState)) {
    if (key.includes(endpoint)) {
      return (value as any)?.payload || value;
    }
  }
  return null;
}

function mergeData(
  jsonLd: Record<string, any> | null,
  serverState: Record<string, any> | null,
  $: cheerio.CheerioAPI,
  url: string
): ParsedListingData {
  const aboveTheFold = findEndpoint(serverState, 'aboveTheFold');
  const belowTheFold = findEndpoint(serverState, 'belowTheFold');

  const mainEntity = jsonLd?.mainEntity || {};
  const address = mainEntity?.address || {};
  const geo = mainEntity?.geo || {};
  const offers = jsonLd?.offers || {};
  const atf = aboveTheFold?.addressSectionInfo || {};

  const price = atf?.priceInfo?.amount || atf?.latestPriceInfo?.amount || offers?.price || 0;
  const beds = atf?.beds ?? mainEntity?.numberOfBedrooms ?? 0;
  const baths = atf?.baths ?? mainEntity?.numberOfBathroomsTotal ?? 0;
  const sqft = atf?.sqFt?.value ?? mainEntity?.floorSize?.value ?? 0;
  const lat = atf?.latLong?.latitude ?? geo?.latitude ?? 0;
  const lng = atf?.latLong?.longitude ?? geo?.longitude ?? 0;

  const streetAddress = atf?.streetAddress?.assembledAddress ||
    address?.streetAddress || getMeta($, 'twitter:text:street_address') || '';
  const city = atf?.city || address?.addressLocality || getMeta($, 'twitter:text:city') || '';
  const state = atf?.state || address?.addressRegion || getMeta($, 'twitter:text:state_code') || '';
  const zip = atf?.zip || address?.postalCode || getMeta($, 'twitter:text:zip') || '';

  const lotSqft = atf?.lotSize || undefined;
  const lotAcres = lotSqft ? lotSqft / 43560 : undefined;
  const yearBuilt = atf?.yearBuilt ?? mainEntity?.yearBuilt ?? undefined;

  let status = 'active';
  const statusDisplay = atf?.status?.displayValue?.toLowerCase() || '';
  if (statusDisplay.includes('pending')) status = 'pending';
  else if (statusDisplay.includes('sold')) status = 'sold';
  else if (statusDisplay.includes('off market')) status = 'off_market';

  const listDate = jsonLd?.datePosted || undefined;
  let daysOnMarket: number | undefined;
  if (listDate) {
    daysOnMarket = Math.floor((Date.now() - new Date(listDate).getTime()) / 86400000);
  }

  const photos = extractPhotos(aboveTheFold, jsonLd, $);

  let propertyType = 'single_family';
  const typeFromPR = belowTheFold?.publicRecordsInfo?.basicInfo?.propertyTypeName?.toLowerCase() || '';
  if (typeFromPR.includes('condo')) propertyType = 'condo';
  else if (typeFromPR.includes('townhouse')) propertyType = 'townhouse';
  else if (typeFromPR.includes('multi')) propertyType = 'multi_family';

  let stories: number | undefined;
  let garageSpaces: number | undefined;
  const pr = belowTheFold?.publicRecordsInfo?.basicInfo;
  if (pr) stories = pr.numStories || undefined;

  const amenities = belowTheFold?.amenitiesInfo?.superGroups;
  if (amenities) {
    for (const sg of amenities) {
      for (const group of sg?.amenityGroups || []) {
        for (const entry of group?.amenityEntries || []) {
          if (entry?.amenityName?.toLowerCase().includes('garage spaces')) {
            garageSpaces = parseInt(entry?.amenityValues?.[0], 10) || undefined;
          }
        }
      }
    }
  }

  return {
    address: streetAddress, city, state, zip,
    latitude: lat, longitude: lng,
    price, bedrooms: beds, bathrooms: baths, sqft,
    lotSqft, lotAcres, yearBuilt, stories, garageSpaces,
    propertyType, listDate, daysOnMarket,
    pricePerSqft: sqft > 0 ? Math.round(price / sqft) : undefined,
    status, photos,
    rawData: { jsonLd, atf: aboveTheFold ? { addressSectionInfo: atf } : null },
  };
}

function extractPhotos(
  aboveTheFold: any,
  jsonLd: Record<string, any> | null,
  $: cheerio.CheerioAPI
): PhotoCandidate[] {
  const photos: PhotoCandidate[] = [];

  // Try reactServerState photos first
  const mediaInfo = aboveTheFold?.mediaBrowserInfo;
  if (mediaInfo?.photos?.length) {
    for (const photo of mediaInfo.photos) {
      const url =
        photo?.photoUrls?.fullScreenPhotoUrl ||
        photo?.photoUrls?.nonFullScreenPhotoUrl ||
        photo?.photoUrls?.nonFullScreenPhotoUrlCompressed;
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
    if (photos.length > 0) return photos;
  }

  // Try JSON-LD photos
  const mainEntity = jsonLd?.mainEntity;
  if (mainEntity?.image?.length) {
    for (const img of mainEntity.image) {
      if (typeof img === 'string') photos.push({ url: img });
      else if (img?.url) photos.push({ url: img.url, width: img.width, height: img.height });
    }
    if (photos.length > 0) return photos;
  }

  // Fallback: meta tag photos
  for (let i = 0; i < 20; i++) {
    const url = getMeta($, `twitter:image:photo${i}`);
    if (url) photos.push({ url });
    else break;
  }

  if (photos.length === 0) {
    const ogImage = getMeta($, 'og:image');
    if (ogImage) photos.push({ url: ogImage });
  }

  return photos;
}

function getMeta($: cheerio.CheerioAPI, name: string): string | undefined {
  return (
    $(`meta[name="${name}"]`).attr('content') ||
    $(`meta[property="${name}"]`).attr('content') ||
    undefined
  );
}
