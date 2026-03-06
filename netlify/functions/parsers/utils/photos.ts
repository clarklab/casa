import type { PhotoCandidate } from '../../lib/types';

// Keywords that indicate junk photos to filter out
const JUNK_KEYWORDS = [
  'floor plan', 'floorplan', 'agent', 'headshot', 'logo', 'map',
  'neighborhood', 'virtual tour', 'icon', 'badge', 'diagram',
  'satellite', 'aerial map', 'community map',
];

// Room types we want, scored by priority
const ROOM_SCORES: Record<string, number> = {
  'exterior': 10,
  'front': 10,
  'facade': 10,
  'curb': 10,
  'kitchen': 8,
  'living': 7,
  'family room': 7,
  'great room': 7,
  'primary bedroom': 6,
  'master bedroom': 6,
  'bedroom': 5,
  'backyard': 5,
  'patio': 5,
  'deck': 5,
  'pool': 5,
  'yard': 5,
  'outdoor': 5,
  'bathroom': 4,
  'dining': 4,
  'laundry': 3,
  'garage': 3,
  'office': 3,
};

function isJunk(photo: PhotoCandidate): boolean {
  const text = [photo.caption, ...(photo.tags || [])].join(' ').toLowerCase();
  if (JUNK_KEYWORDS.some((kw) => text.includes(kw))) return true;
  // Filter tiny images (icons, badges)
  if (photo.width && photo.width < 200) return true;
  if (photo.height && photo.height < 200) return true;
  return false;
}

function scorePhoto(photo: PhotoCandidate, index: number): number {
  let score = 0;
  const text = [photo.caption, ...(photo.tags || [])].join(' ').toLowerCase();

  // Room type scoring from caption/tags
  for (const [room, roomScore] of Object.entries(ROOM_SCORES)) {
    if (text.includes(room)) {
      score += roomScore;
      break; // Only count the best match
    }
  }

  // Position bonus: first photo is almost always the hero/exterior
  if (index === 0) score += 15;
  else if (index < 5) score += 3;
  else if (index < 10) score += 1;

  return score;
}

export function selectBest4Photos(photos: PhotoCandidate[]): PhotoCandidate[] {
  if (photos.length <= 4) return photos;

  // Filter out junk
  const clean = photos.filter((p) => !isJunk(p));

  if (clean.length <= 4) {
    // Not enough clean photos, backfill from originals
    const result = [...clean];
    for (const p of photos) {
      if (result.length >= 4) break;
      if (!result.includes(p)) result.push(p);
    }
    return result.slice(0, 4);
  }

  // Score and sort
  const scored = clean.map((photo, i) => ({
    photo,
    originalIndex: photos.indexOf(photo),
    score: scorePhoto(photo, photos.indexOf(photo)),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Pick top 4 but try to diversify room types
  const selected: typeof scored = [];
  const usedRoomTypes = new Set<string>();

  for (const item of scored) {
    if (selected.length >= 4) break;

    const text = [item.photo.caption, ...(item.photo.tags || [])].join(' ').toLowerCase();
    let roomType = 'unknown';
    for (const room of Object.keys(ROOM_SCORES)) {
      if (text.includes(room)) {
        roomType = room;
        break;
      }
    }

    // Skip if we already have this room type (unless we don't have 4 yet and are running low)
    if (usedRoomTypes.has(roomType) && scored.length - scored.indexOf(item) > 4 - selected.length) {
      continue;
    }

    selected.push(item);
    usedRoomTypes.add(roomType);
  }

  // If we don't have 4 yet, backfill from remaining scored photos
  if (selected.length < 4) {
    for (const item of scored) {
      if (selected.length >= 4) break;
      if (!selected.includes(item)) selected.push(item);
    }
  }

  // Sort by original position for natural ordering
  selected.sort((a, b) => a.originalIndex - b.originalIndex);

  return selected.map((s) => s.photo);
}
