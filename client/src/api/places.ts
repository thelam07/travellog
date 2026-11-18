// client/src/api/places.ts
// B12 (mục 10.1): gợi ý + chi tiết địa điểm qua Google Places.
// Server giữ API key; client chỉ cần biết placeId/text/address/lat/lng.

import { api } from './client';
import type { PlaceDetail, PlaceSuggestion } from '../types';

export const placesApi = {
  /** Gợi ý địa điểm theo từ khoá. Server: GET /api/places/autocomplete?q=...&sessionToken=... */
  autocomplete: async (q: string, sessionToken?: string): Promise<PlaceSuggestion[]> => {
    const params: Record<string, string> = { q };
    if (sessionToken) params.sessionToken = sessionToken;
    const res = await api.get<PlaceSuggestion[]>('/places/autocomplete', { params });
    return res.data;
  },

  /** Chi tiết địa điểm (toạ độ + địa chỉ). Server: GET /api/places/:placeId?sessionToken=... */
  detail: async (placeId: string, sessionToken?: string): Promise<PlaceDetail> => {
    const params: Record<string, string> = {};
    if (sessionToken) params.sessionToken = sessionToken;
    const res = await api.get<PlaceDetail>(`/places/${encodeURIComponent(placeId)}`, { params });
    return res.data;
  },
};
