const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://bachdat.site';

let token: string | null = null;

export const getApiUrl = () => API_URL;

export const setToken = (t: string | null) => {
  token = t;
};

export const getToken = () => token;

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Request failed (${res.status})`,
    );
  }
  return data as T;
}
