import type { Context } from '@netlify/functions';
import { validatePasscode, unauthorizedResponse } from './lib/auth';
import { getListingsStore, getImagesStore } from './lib/blobs';
import { updateListingInIndex, listingToSummary } from './lib/index-manager';
import type { Listing, ParsedListingData } from './lib/types';
import { fetchPage } from './parsers/utils/fetch';
import { selectBestPhotos } from './parsers/utils/photos';
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
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    // Path: /api/listings/:id/rescrape → id is second-to-last
    const id = pathParts[pathParts.length - 2];

    const body = await req.json();
    const { passcode } = body;

    if (!validatePasscode(passcode)) {
      return unauthorizedResponse();
    }

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Listing ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const store = getListingsStore();
    const listing = await store.get(`listing:${id}`, { type: 'json' }) as Listing | null;

    if (!listing) {
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!listing.sourceUrl) {
      return new Response(
        JSON.stringify({ error: 'Listing has no source URL to rescrape' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Re-scrape photos from the source URL
    const sourceSite = detectSite(listing.sourceUrl);
    let parsed: ParsedListingData;

    try {
      if (sourceSite === 'redfin') {
        try {
          const html = await fetchPage(listing.sourceUrl);
          parsed = parseRedfin(html, listing.sourceUrl);
        } catch (fetchErr: any) {
          console.log(`HTML fetch failed (${fetchErr.message}), trying Redfin API fallback...`);
          parsed = await parseRedfinFromApi(listing.sourceUrl);
        }
      } else {
        const html = await fetchPage(listing.sourceUrl);
        switch (sourceSite) {
          case 'zillow':
            parsed = parseZillow(html, listing.sourceUrl);
            break;
          default:
            parsed = parseGeneric(html, listing.sourceUrl);
            break;
        }
      }
    } catch (parseError: any) {
      return new Response(
        JSON.stringify({ error: 'Failed to rescrape', message: parseError.message }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Rescrape ${id}: found ${parsed.photos.length} photos`);

    const bestPhotos = selectBestPhotos(parsed.photos);
    console.log(`Selected ${bestPhotos.length} best photos`);

    // Delete old image blobs
    const imageStore = getImagesStore();
    if (listing.imageKeys?.length) {
      await Promise.allSettled(
        listing.imageKeys.map((key) => imageStore.delete(key))
      );
      console.log(`Deleted ${listing.imageKeys.length} old images`);
    }

    // Store new images
    const imageKeys = await processAndStoreImages(id, bestPhotos);
    console.log(`Stored ${imageKeys.length} new images`);

    // Update listing — only imageKeys change, everything else preserved
    listing.imageKeys = imageKeys;

    await store.setJSON(`listing:${id}`, listing);
    await updateListingInIndex(id, listingToSummary(listing));

    return new Response(
      JSON.stringify({ success: true, imageCount: imageKeys.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Rescrape error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to rescrape', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/listings/:id/rescrape',
  method: 'POST',
};
