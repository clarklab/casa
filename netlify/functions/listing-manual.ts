import type { Context } from '@netlify/functions';
import { validatePasscode, unauthorizedResponse } from './lib/auth';
import { getListingsStore } from './lib/blobs';
import { addListingToIndex } from './lib/index-manager';
import { processAndStoreImages } from './parsers/utils/images';
import type { Listing } from './lib/types';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { passcode, addedBy, address, city, state, zip, price, bedrooms, bathrooms, sqft,
            lotSqft, lotAcres, yearBuilt, propertyType, hoaMonthly, imageUrls, sourceUrl,
            latitude, longitude } = body;

    if (!validatePasscode(passcode)) {
      return unauthorizedResponse();
    }

    if (!address || !price || !addedBy) {
      return new Response(
        JSON.stringify({ success: false, error: 'SCRAPE_FAILED', message: 'address, price, and addedBy are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const id = crypto.randomUUID();

    // Process images if provided
    let imageKeys: string[] = [];
    if (imageUrls?.length) {
      const photos = imageUrls.map((url: string) => ({ url }));
      imageKeys = await processAndStoreImages(id, photos);
    }

    const listing: Listing = {
      id,
      createdAt: new Date().toISOString(),
      addedBy,
      sourceUrl: sourceUrl || '',
      sourceSite: 'other',
      address,
      city: city || '',
      state: state || '',
      zip: zip || '',
      latitude: latitude || 0,
      longitude: longitude || 0,
      price,
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0,
      sqft: sqft || 0,
      lotSqft: lotSqft || undefined,
      lotAcres: lotAcres || undefined,
      yearBuilt: yearBuilt || undefined,
      propertyType: propertyType || 'single_family',
      hoaMonthly: hoaMonthly ?? null,
      pricePerSqft: sqft > 0 ? Math.round(price / sqft) : undefined,
      status: 'active',
      imageKeys,
      notes: [],
      tags: [],
      isFavorited: false,
      isArchived: false,
    };

    const store = getListingsStore();
    await store.setJSON(`listing:${id}`, listing);
    await addListingToIndex(listing);

    return new Response(
      JSON.stringify({
        success: true,
        listing: { ...listing, noteCount: 0 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error adding manual listing:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'SCRAPE_FAILED', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/listings/manual',
};
