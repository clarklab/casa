import { getStore } from '@netlify/blobs';

export function getListingsStore() {
  return getStore('listings');
}

export function getImagesStore() {
  return getStore('images');
}
