import { apiFetch } from './client';
import type { LoginResponse, UserProfile } from '../types/auth';

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
