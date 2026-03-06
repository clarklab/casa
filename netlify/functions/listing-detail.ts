import type { Context } from '@netlify/functions';
import { getListingsStore } from './lib/blobs';
import type { Listing } from './lib/types';

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
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
    const store = getListingsStore();
    const listing = await store.get(`listing:${id}`, { type: 'json' }) as Listing | null;

    if (!listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ listing }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10',
      },
    });
  } catch (error: any) {
    console.error('Error fetching listing detail:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch listing', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/listings/:id',
  method: 'GET',
};
