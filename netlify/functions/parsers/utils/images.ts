import sharp from 'sharp';
import { getImagesStore } from '../../lib/blobs';
import { fetchImage } from './fetch';
import type { PhotoCandidate } from '../../lib/types';

export async function processAndStoreImages(
  listingId: string,
  photos: PhotoCandidate[]
): Promise<string[]> {
  const store = getImagesStore();
  const keys: string[] = [];

  const results = await Promise.allSettled(
    photos.map(async (photo, index) => {
      const key = `img:${listingId}:${index}`;
      try {
        const buffer = await fetchImage(photo.url);
        const processed = await sharp(buffer)
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        await store.set(key, processed, {
          metadata: { contentType: 'image/webp' },
        });
        return key;
      } catch (err) {
        console.error(`Failed to process image ${index} for ${listingId}:`, err);
        return null;
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      keys.push(result.value);
    }
  }

  return keys;
}
