import type { Context } from '@netlify/functions';
import { validatePasscode, unauthorizedResponse } from './lib/auth';
import { getListingsStore } from './lib/blobs';
import { updateListingInIndex } from './lib/index-manager';
import type { Listing, Note } from './lib/types';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { listingId, text, author, passcode } = body;

    if (!validatePasscode(passcode)) {
      return unauthorizedResponse();
    }

    if (!listingId || !text || !author) {
      return new Response(
        JSON.stringify({ error: 'listingId, text, and author are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const store = getListingsStore();
    const listing = await store.get(`listing:${listingId}`, { type: 'json' }) as Listing | null;

    if (!listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const note: Note = {
      id: crypto.randomUUID(),
      text,
      author,
      createdAt: new Date().toISOString(),
    };

    listing.notes.push(note);
    await store.setJSON(`listing:${listingId}`, listing);

    // Update note count in index
    await updateListingInIndex(listingId, { noteCount: listing.notes.length });

    return new Response(JSON.stringify({ success: true, note }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error adding note:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to add note', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/notes',
};
