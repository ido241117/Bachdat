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
import { authApi } from '../api';
import { setToken } from '../api/client';
import type { ApiUser } from '../api/types';

const TOKEN_KEY = 'mealnow_token';
const USER_KEY = 'mealnow_user';

type AuthContextValue = {
  user: ApiUser | null;
  ready: boolean;
  login: (phone: string, otp: string, name?: string) => Promise<{ needsName: boolean }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [ready, setReady] = useState(false);

  const persist = useCallback(async (token: string, nextUser: ApiUser) => {
    setToken(token);
    setUser(nextUser);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(nextUser)],
    ]);
  }, []);

  const login = useCallback(async (phone: string, otp: string, name?: string) => {
    const result = await authApi.login(phone, otp, name);
    if (result.needsName) return { needsName: true };
    await persist(result.token, result.user);
    return { needsName: false };
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network logout errors
    }
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [[, savedToken], [, savedUser]] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          USER_KEY,
        ]);

        if (savedToken && savedUser) {
          setToken(savedToken);
          if (!cancelled) setUser(JSON.parse(savedUser) as ApiUser);
        }
      } catch (err) {
        console.warn('Auth bootstrap failed', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout }),
    [user, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
