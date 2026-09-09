import { API_BASE_URL, API_PREFIX } from '../lib/constants';
import { readAuthState, writeAuthState, clearAuthState } from '../store/authStore';
import { refreshAccessToken } from './auth';

let refreshPromise: Promise<string> | null = null;

async function refresh(): Promise<string> {
  const state = readAuthState();

  if (!state.refreshToken) {
    throw new Error('No refresh token');
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(state.refreshToken)
      .then((result) => {
        writeAuthState({
          token: result.access_token,
          refreshToken: result.refresh_token,
          username: state.username,
        });

        window.dispatchEvent(new Event('auth-changed'));

        return result.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  canRefresh = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && canRefresh && path !== '/auth/refresh') {
    try {
      const accessToken = await refresh();

      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${accessToken}`);

      return apiFetch<T>(
        path,
        {
          ...options,
          headers,
        },
        false,
      );
    } catch {
      clearAuthState();
      window.dispatchEvent(new Event('auth-changed'));
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? errorBody.detail ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}