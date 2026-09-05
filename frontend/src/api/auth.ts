import { apiFetch } from './client';
import type { LoginResponse, UserProfile } from '../types/auth';
import { API_BASE_URL, API_PREFIX } from '../lib/constants';

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(`/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Refresh token expired');
  }

  return response.json() as Promise<LoginResponse>;
}
