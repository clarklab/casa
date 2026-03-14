import type {
  ScrapeRequest,
  ScrapeResponse,
  ListingsResponse,
  ListingDetailResponse,
  UpdateListingRequest,
  AddNoteRequest,
  AddNoteResponse,
  ManualListingRequest,
  DeleteListingRequest,
} from './types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  scrape(data: ScrapeRequest) {
    return fetchJSON<ScrapeResponse>(`${API_BASE}/scrape`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getListings() {
    return fetchJSON<ListingsResponse>(`${API_BASE}/listings`, {
      cache: 'no-cache',
    });
  },

  getListing(id: string) {
    return fetchJSON<ListingDetailResponse>(`${API_BASE}/listings/${id}`, {
      cache: 'no-cache',
    });
  },

  updateListing(id: string, data: UpdateListingRequest) {
    return fetchJSON<{ success: boolean }>(`${API_BASE}/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteListing(id: string, data: DeleteListingRequest) {
    return fetchJSON<{ success: boolean }>(`${API_BASE}/listings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  addNote(data: AddNoteRequest) {
    return fetchJSON<AddNoteResponse>(`${API_BASE}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  addManualListing(data: ManualListingRequest) {
    return fetchJSON<ScrapeResponse>(`${API_BASE}/listings/manual`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getImageUrl(key: string) {
    return `${API_BASE}/images/${encodeURIComponent(key)}`;
  },
};
