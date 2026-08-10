const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY || '';
const BASE = 'https://rsapi.goong.io';

export type GoongPrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
};

export type GoongLatLng = { lat: number; lng: number };

export type GoongPlaceDetail = {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: GoongLatLng };
};

export type GoongRoute = {
  distanceText: string;
  durationText: string;
  distanceMeters: number;
  durationSeconds: number;
  /** [lng, lat][] */
  coordinates: [number, number][];
};

function assertKey() {
  if (!GOONG_API_KEY) {
    throw new Error('Thiếu EXPO_PUBLIC_GOONG_API_KEY trong mobile/.env');
  }
}

async function goongGet<T>(path: string, params: Record<string, string>): Promise<T> {
  assertKey();
  const q = new URLSearchParams({ ...params, api_key: GOONG_API_KEY });
  const res = await fetch(`${BASE}${path}?${q.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Goong error (${res.status})`);
  }
  return data as T;
}

/** Decode Google/Goong encoded polyline → [lng, lat][] */
export function decodePolyline(encoded: string): [number, number][] {
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

export const goongApi = {
  autocomplete: async (
    input: string,
    location?: GoongLatLng,
  ): Promise<GoongPrediction[]> => {
    if (!input.trim()) return [];
    const params: Record<string, string> = {
      input: input.trim(),
      limit: '8',
    };
    if (location) {
      params.location = `${location.lat},${location.lng}`;
    }
    const data = await goongGet<{
      predictions?: GoongPrediction[];
      status?: string;
    }>('/Place/AutoComplete', params);
    return data.predictions || [];
  },

  placeDetail: async (placeId: string): Promise<GoongPlaceDetail> => {
    const data = await goongGet<{ result: GoongPlaceDetail; status: string }>(
      '/Place/Detail',
      { place_id: placeId },
    );
    if (!data.result) throw new Error('Không lấy được chi tiết địa chỉ');
    return data.result;
  },

  direction: async (
    origin: GoongLatLng,
    destination: GoongLatLng,
    vehicle: 'bike' | 'car' = 'bike',
  ): Promise<GoongRoute | null> => {
    const data = await goongGet<{
      routes?: Array<{
        overview_polyline?: { points?: string };
        legs?: Array<{
          distance?: { text?: string; value?: number };
          duration?: { text?: string; value?: number };
        }>;
      }>;
    }>('/Direction', {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      vehicle,
    });

    const route = data.routes?.[0];
    if (!route) return null;
    const leg = route.legs?.[0];
    const points = route.overview_polyline?.points || '';
    return {
      distanceText: leg?.distance?.text || '',
      durationText: leg?.duration?.text || '',
      distanceMeters: leg?.distance?.value || 0,
      durationSeconds: leg?.duration?.value || 0,
      coordinates: points ? decodePolyline(points) : [],
    };
  },

  reverseGeocode: async (lat: number, lng: number) => {
    const all = await goongApi.reverseGeocodeAll(lat, lng);
    if (!all.length) {
      throw new Error('Không tìm thấy địa chỉ tại vị trí này');
    }
    return all[0];
  },

  /** Nhiều kết quả quanh ghim — dùng cho "Địa chỉ gợi ý". */
  reverseGeocodeAll: async (lat: number, lng: number) => {
    const data = await goongGet<{
      results?: Array<{
        formatted_address?: string;
        name?: string;
        place_id?: string;
        geometry?: { location?: { lat: number; lng: number } };
        address_components?: Array<{ long_name: string; short_name: string }>;
      }>;
      status?: string;
    }>('/Geocode', {
      latlng: `${lat},${lng}`,
    });

    const results = data.results || [];
    if (!results.length) return [];

    const ranked = results
      .map((r) => {
        const p = r.geometry?.location;
        if (!p) return { r, dist: Number.POSITIVE_INFINITY, lat, lng };
        const dLat = (p.lat - lat) * 111_320;
        const dLng =
          (p.lng - lng) * 111_320 * Math.cos((lat * Math.PI) / 180);
        return {
          r,
          dist: Math.hypot(dLat, dLng),
          lat: p.lat,
          lng: p.lng,
        };
      })
      .sort((a, b) => a.dist - b.dist);

    const seen = new Set<string>();
    const items: Array<{
      label: string;
      fullAddress: string;
      placeId?: string;
      lat: number;
      lng: number;
    }> = [];

    for (const { r, lat: rLat, lng: rLng } of ranked) {
      const fullAddress = r.formatted_address || r.name || '';
      if (!fullAddress) continue;
      const key = fullAddress.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      const label =
        r.name?.trim() ||
        r.address_components?.[0]?.long_name?.trim() ||
        fullAddress.split(',')[0]?.trim() ||
        'Điểm giao';
      items.push({
        label,
        fullAddress,
        placeId: r.place_id,
        // Gợi ý POI: dùng tọa độ POI; mục đầu (gần ghim) vẫn ưu tiên ghim
        lat: items.length === 0 ? lat : rLat,
        lng: items.length === 0 ? lng : rLng,
      });
      if (items.length >= 12) break;
    }

    return items;
  },
};

export const hasGoongKeys = () =>
  Boolean(
    process.env.EXPO_PUBLIC_GOONG_MAPS_KEY &&
      process.env.EXPO_PUBLIC_GOONG_API_KEY,
  );
