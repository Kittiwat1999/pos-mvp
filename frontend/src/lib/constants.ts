export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
export const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL ?? 'http://192.168.0.115:5174';
export const API_V1_PREFIX = '/api/v1';
export const AUTH_STORAGE_KEY = 'pos-mvp-auth';
export const ORDER_POLLING_INTERVAL_MS = 5000;

export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  checkout: '/order/:sessionId/checkout',
} as const;
