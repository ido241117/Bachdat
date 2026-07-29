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

const TOKEN_KEY = 'qb_token';
const USER_KEY = 'qb_user';
const DEMO_PHONE = '0901234567';
const DEMO_OTP = '123456';

type AuthContextValue = {
  user: ApiUser | null;
  ready: boolean;
  loginDemo: () => Promise<void>;
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

  const loginDemo = useCallback(async () => {
    await authApi.requestOtp(DEMO_PHONE);
    const { token, user: nextUser } = await authApi.login(DEMO_PHONE, DEMO_OTP);
    await persist(token, nextUser);
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
        } else {
          await authApi.requestOtp(DEMO_PHONE);
          const { token, user: nextUser } = await authApi.login(
            DEMO_PHONE,
            DEMO_OTP,
          );
          if (!cancelled) await persist(token, nextUser);
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
  }, [persist]);

  const value = useMemo(
    () => ({ user, ready, loginDemo, logout }),
    [user, ready, loginDemo, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
