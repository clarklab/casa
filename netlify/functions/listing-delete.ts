import type { Context } from '@netlify/functions';
import { validatePasscode, unauthorizedResponse } from './lib/auth';
import { getListingsStore, getImagesStore } from './lib/blobs';
import { removeListingFromIndex } from './lib/index-manager';
import type { Listing } from './lib/types';

export default async (req: Request, context: Context) => {
  if (req.method !== 'DELETE') {
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
    const body = await req.json();
    const { passcode } = body;

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

    // Delete images
    const imageStore = getImagesStore();
    await Promise.allSettled(
      listing.imageKeys.map((key) => imageStore.delete(key))
    );

    // Delete listing blob
    await store.delete(`listing:${id}`);

    // Remove from index
    await removeListingFromIndex(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting listing:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete listing', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/listings/:id',
  method: 'DELETE',
};
