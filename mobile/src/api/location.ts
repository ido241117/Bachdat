import * as Location from 'expo-location';
import type { GoongLatLng } from './goong';

const GPS_TIMEOUT_MS = 2500;

function coordsOf(pos: Location.LocationObject): GoongLatLng {
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Xin quyền vị trí (cached lần sau). */
export async function ensureLocationPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === 'granted') return true;
  const next = await Location.requestForegroundPermissionsAsync();
  return next.status === 'granted';
}

/**
 * Lấy vị trí nhanh: last-known trước → GPS low accuracy (timeout ngắn).
 * Không block lâu; trả null nếu không kịp.
 */
export async function getQuickLatLng(): Promise<GoongLatLng | null> {
  const ok = await ensureLocationPermission();
  if (!ok) return null;

  const last = await Location.getLastKnownPositionAsync({
    maxAge: 1000 * 60 * 5,
    requiredAccuracy: 500,
  });
  if (last) return coordsOf(last);

  const fresh = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
      mayShowUserSettingsDialog: false,
    }),
    GPS_TIMEOUT_MS,
  );
  return fresh ? coordsOf(fresh) : null;
}

/** GPS tinh hơn (dùng nền / nút recenter). */
export async function getFreshLatLng(): Promise<GoongLatLng | null> {
  const ok = await ensureLocationPermission();
  if (!ok) return null;
  const fresh = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: false,
    }),
    5000,
  );
  return fresh ? coordsOf(fresh) : null;
}
