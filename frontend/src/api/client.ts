import { API_BASE_URL } from '../lib/constants';
import { API_PREFIX } from '../lib/constants';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL+API_PREFIX}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? errorBody.detail ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}
