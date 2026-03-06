import * as cheerio from 'cheerio';
import type { ParsedListingData, PhotoCandidate } from '../lib/types';

export function parseGeneric(html: string, url: string): ParsedListingData {
  const $ = cheerio.load(html);

  // Try JSON-LD first
  const jsonLd = extractJsonLd($);
  // Fall back to OG/meta tags
  const meta = extractMeta($);

  const data = jsonLd || meta;
  if (!data) {
    throw new Error('Could not extract listing data from page');
  }

  return data;
}

function extractJsonLd($: cheerio.CheerioAPI): ParsedListingData | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const text = $(scripts[i]).html();
      if (!text) continue;
      const data = JSON.parse(text);

      // Look for RealEstateListing or Product with residence
      const types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
      const isListing = types.some(
        (t: string) =>
          t === 'RealEstateListing' ||
          t === 'SingleFamilyResidence' ||
          t === 'Residence' ||
          t === 'Product'
      );

      if (!isListing) continue;

      const mainEntity = data.mainEntity || data;
      const address = mainEntity.address || {};
      const geo = mainEntity.geo || {};
      const offers = data.offers || mainEntity.offers || {};
      const floorSize = mainEntity.floorSize || {};

      const photos: PhotoCandidate[] = [];
      const images = mainEntity.image || data.image || [];
      const imageList = Array.isArray(images) ? images : [images];
      for (const img of imageList) {
        if (typeof img === 'string') photos.push({ url: img });
        else if (img?.url) photos.push({ url: img.url, width: img.width, height: img.height });
      }

      const price = offers.price || 0;
      const sqft = floorSize.value || 0;

      return {
        address: address.streetAddress || '',
        city: address.addressLocality || '',
        state: address.addressRegion || '',
        zip: address.postalCode || '',
        latitude: parseFloat(geo.latitude) || 0,
        longitude: parseFloat(geo.longitude) || 0,
        price: typeof price === 'string' ? parseInt(price, 10) : price,
        bedrooms: mainEntity.numberOfBedrooms || 0,
        bathrooms: mainEntity.numberOfBathroomsTotal || mainEntity.numberOfBathrooms || 0,
        sqft: typeof sqft === 'string' ? parseInt(sqft, 10) : sqft,
        yearBuilt: mainEntity.yearBuilt || undefined,
        status: 'active',
        photos,
        rawData: { jsonLd: data },
      };
    } catch {
      continue;
    }
  }
  return null;
}

function extractMeta($: cheerio.CheerioAPI): ParsedListingData | null {
  const title = $('meta[property="og:title"]').attr('content') || $('title').text();
  const description = $('meta[property="og:description"]').attr('content') || '';
  const image = $('meta[property="og:image"]').attr('content');

  if (!title) return null;

  const photos: PhotoCandidate[] = [];
  if (image) photos.push({ url: image });

  // Try to parse basic info from title/description
  const priceMatch = description.match(/\$[\d,]+/);
  const bedsMatch = description.match(/(\d+)\s*(?:bed|br|bd)/i);
  const bathsMatch = description.match(/([\d.]+)\s*(?:bath|ba)/i);
  const sqftMatch = description.match(/([\d,]+)\s*(?:sq\s*ft|sqft)/i);

  return {
    address: title.split(',')[0] || title,
    city: '',
    state: '',
    zip: '',
    latitude: 0,
    longitude: 0,
    price: priceMatch ? parseInt(priceMatch[0].replace(/[$,]/g, ''), 10) : 0,
    bedrooms: bedsMatch ? parseInt(bedsMatch[1], 10) : 0,
    bathrooms: bathsMatch ? parseFloat(bathsMatch[1]) : 0,
    sqft: sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, ''), 10) : 0,
    status: 'active',
    photos,
    rawData: { title, description },
  };
}
