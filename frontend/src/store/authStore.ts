import { AUTH_STORAGE_KEY } from '../lib/constants';

export type AuthState = {
  token: string | null;
  username: string | null;
  refreshToken: string | null;
};

export function readAuthState(): AuthState {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return { token: null, username: null, refreshToken: null };
  }

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return { token: null, username: null, refreshToken: null };
  }
}

export function writeAuthState(next: AuthState) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
}

export function clearAuthState() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
