import type { Context } from '@netlify/functions';
import { getImagesStore } from './lib/blobs';

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  // Key format: img:listingId:index — the key is the last path segment(s)
  const key = decodeURIComponent(pathParts.slice(3).join('/'));

  if (!key) {
    return new Response('Image key required', { status: 400 });
  }

  try {
    const store = getImagesStore();
    const { data, metadata } = await store.getWithMetadata(key, { type: 'arrayBuffer' });

    if (!data) {
      return new Response('Image not found', { status: 404 });
    }

    return new Response(data as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': (metadata as any)?.contentType || 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving image:', error);
    return new Response('Image not found', { status: 404 });
  }
};

export const config = {
  path: '/api/images/*',
};
