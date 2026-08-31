import { apiFetch } from './client';
import { API_V1_PREFIX } from '../lib/constants';
import type { LoginResponse, UserProfile } from '../types/auth';

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(`${API_V1_PREFIX}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`${API_V1_PREFIX}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
