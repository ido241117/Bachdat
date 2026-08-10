import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { userApi } from '../api';
import { goongApi } from '../api/goong';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'mealnow_delivery_location';

export type DeliveryLocation = {
  label: string;
  fullAddress: string;
  lat: number;
  lng: number;
  addressId?: string;
};

type DeliveryLocationContextValue = {
  location: DeliveryLocation | null;
  ready: boolean;
  setLocation: (next: DeliveryLocation) => Promise<void>;
  clearLocation: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
};

const DeliveryLocationContext =
  createContext<DeliveryLocationContextValue | null>(null);

async function locateFromGps(): Promise<DeliveryLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    try {
      const geo = await goongApi.reverseGeocode(lat, lng);
      return {
        label: geo.label || 'Vị trí hiện tại',
        fullAddress: geo.fullAddress,
        lat,
        lng,
      };
    } catch {
      return {
        label: 'Vị trí hiện tại',
        fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      };
    }
  } catch {
    return null;
  }
}

export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [location, setLocationState] = useState<DeliveryLocation | null>(null);
  const [ready, setReady] = useState(false);

  const persist = useCallback(async (next: DeliveryLocation | null) => {
    setLocationState(next);
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setLocation = useCallback(
    async (next: DeliveryLocation) => {
      await persist(next);
    },
    [persist],
  );

  const clearLocation = useCallback(async () => {
    await persist(null);
  }, [persist]);

  const refreshFromServer = useCallback(async () => {
    if (!user) return;
    try {
      const list = await userApi.addresses();
      const def = list.find((a) => a.isDefault) || list[0];
      if (!def) return;
      await persist({
        label: def.label,
        fullAddress: def.fullAddress,
        lat: def.lat,
        lng: def.lng,
        addressId: def._id,
      });
    } catch {
      // keep local
    }
  }, [user, persist]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        let current: DeliveryLocation | null = raw
          ? (JSON.parse(raw) as DeliveryLocation)
          : null;
        if (current && !cancelled) {
          setLocationState(current);
        }

        if (user) {
          const list = await userApi.addresses().catch(() => []);
          const def = list.find((a) => a.isDefault) || list[0];
          if (def && !cancelled) {
            current = {
              label: def.label,
              fullAddress: def.fullAddress,
              lat: def.lat,
              lng: def.lng,
              addressId: def._id,
            };
            await persist(current);
          }
        }

        // Chưa có địa chỉ nào → tự lấy GPS
        if (!cancelled && !current) {
          const gps = await locateFromGps();
          if (gps && !cancelled) {
            await persist(gps);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      location,
      ready,
      setLocation,
      clearLocation,
      refreshFromServer,
    }),
    [location, ready, setLocation, clearLocation, refreshFromServer],
  );

  return (
    <DeliveryLocationContext.Provider value={value}>
      {children}
    </DeliveryLocationContext.Provider>
  );
}

export function useDeliveryLocation() {
  const ctx = useContext(DeliveryLocationContext);
  if (!ctx) {
    throw new Error('useDeliveryLocation must be used within DeliveryLocationProvider');
  }
  return ctx;
}
