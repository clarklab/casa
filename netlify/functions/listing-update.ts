import type { Context } from '@netlify/functions';
import { validatePasscode, unauthorizedResponse } from './lib/auth';
import { getListingsStore } from './lib/blobs';
import { updateListingInIndex, listingToSummary } from './lib/index-manager';
import type { Listing } from './lib/types';

export default async (req: Request, context: Context) => {
  if (req.method !== 'PATCH') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id) {
    return new Response(JSON.stringify({ error: 'Listing ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json() as { passcode: string; updates: Record<string, any> };

    const { passcode, updates } = body;

    if (!validatePasscode(passcode)) {
      return unauthorizedResponse();
    }

    const store = getListingsStore();
    const listing = await store.get(`listing:${id}`, { type: 'json' }) as Listing | null;

    if (!listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Apply allowed updates
    const allowedFields = ['rating', 'isFavorited', 'isArchived', 'tags', 'status'] as const;
    for (const field of allowedFields) {
      if (field in updates) {
        (listing as any)[field] = updates[field];
      }
    }

    // Merge per-person ratings (don't overwrite the whole object)
    if (updates.ratings) {
      const merged: Record<string, number> = {
        ...(listing.ratings || {}),
        ...(updates.ratings as Record<string, number>),
      };
      listing.ratings = merged;
      // Recompute average rating from per-person ratings
      const values = Object.values(merged);
      listing.rating = values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : undefined;
    }

    // Save updated listing
    await store.setJSON(`listing:${id}`, listing);

    // Update index
    const summary = listingToSummary(listing);
    await updateListingInIndex(id, summary);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error updating listing:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update listing', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/listings/:id',
  method: 'PATCH',
};
