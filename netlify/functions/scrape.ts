import type { Context } from '@netlify/functions';
import { validatePasscode, unauthorizedResponse } from './lib/auth';
import { getListingsStore } from './lib/blobs';
import { addListingToIndex, getIndex } from './lib/index-manager';
import type { Listing, ParsedListingData } from './lib/types';
import { fetchPage } from './parsers/utils/fetch';
import { selectBest4Photos } from './parsers/utils/photos';
import { processAndStoreImages } from './parsers/utils/images';
import { parseRedfin, parseRedfinFromApi } from './parsers/redfin';
import { parseZillow } from './parsers/zillow';
import { parseGeneric } from './parsers/generic';

function detectSite(url: string): 'zillow' | 'redfin' | 'realtor' | 'other' {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('redfin')) return 'redfin';
  if (hostname.includes('zillow')) return 'zillow';
  if (hostname.includes('realtor')) return 'realtor';
  return 'other';
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { url, addedBy, passcode } = body;

    if (!validatePasscode(passcode)) {
      return unauthorizedResponse();
    }

    if (!url || !addedBy) {
      return new Response(
        JSON.stringify({ success: false, error: 'SCRAPE_FAILED', message: 'URL and addedBy are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'SCRAPE_FAILED', message: 'Invalid URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Detect site
    const sourceSite = detectSite(url);
    const store = getListingsStore();

    // Parse the listing
    let parsed: ParsedListingData;
    try {
      if (sourceSite === 'redfin') {
        // Try ScrapingBee HTML fetch first, fall back to API-only
        try {
          const html = await fetchPage(url);
          console.log(`Fetched ${html.length} bytes via ${process.env.SCRAPINGBEE_API_KEY ? 'ScrapingBee' : 'direct'}`);
          parsed = parseRedfin(html, url);
        } catch (fetchErr: any) {
          console.log(`HTML fetch failed (${fetchErr.message}), trying Redfin API fallback...`);
          parsed = await parseRedfinFromApi(url);
        }
      } else {
        const html = await fetchPage(url);
        console.log(`Fetched ${html.length} bytes`);
        switch (sourceSite) {
          case 'zillow':
            parsed = parseZillow(html, url);
            break;
          default:
            parsed = parseGeneric(html, url);
            break;
        }
      }
    } catch (parseError: any) {
      console.error('Parse error:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SCRAPE_FAILED',
          message: `Failed to parse listing: ${parseError.message}`,
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsed: ${parsed.address}, ${parsed.city} - $${parsed.price}, ${parsed.photos.length} photos`);

    // Select best 4 photos
    const bestPhotos = selectBest4Photos(parsed.photos);
    console.log(`Selected ${bestPhotos.length} best photos`);

    // Generate listing ID
    const id = crypto.randomUUID();

    // Process and store images
    const imageKeys = await processAndStoreImages(id, bestPhotos);
    console.log(`Stored ${imageKeys.length} images`);

    // Create full listing object
    const listing: Listing = {
      id,
      createdAt: new Date().toISOString(),
      addedBy,
      sourceUrl: url,
      sourceSite,
      address: parsed.address,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
      neighborhood: parsed.neighborhood,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      price: parsed.price,
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      sqft: parsed.sqft,
      lotSqft: parsed.lotSqft,
      lotAcres: parsed.lotAcres,
      yearBuilt: parsed.yearBuilt,
      stories: parsed.stories,
      garageSpaces: parsed.garageSpaces,
      hoaMonthly: parsed.hoaMonthly ?? null,
      propertyType: parsed.propertyType,
      listDate: parsed.listDate,
      daysOnMarket: parsed.daysOnMarket,
      pricePerSqft: parsed.pricePerSqft,
      zestimate: parsed.zestimate,
      status: parsed.status,
      imageKeys,
      notes: [],
      tags: [],
      isFavorited: false,
      isArchived: false,
      rawData: parsed.rawData,
    };

    // Store listing blob
    await store.setJSON(`listing:${id}`, listing);
    console.log(`Stored listing:${id}`);

    // Update index
    await addListingToIndex(listing);
    console.log('Updated index');

    // Return summary
    const { rawData, notes, ...summaryBase } = listing;
    return new Response(
      JSON.stringify({
        success: true,
        listing: { ...summaryBase, noteCount: 0 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SCRAPE_FAILED',
        message: error.message || 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/scrape',
};
