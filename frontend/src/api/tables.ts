import { apiFetch } from './client';
import { API_V1_PREFIX } from '../lib/constants';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING';

export type Table = {
  id: string;
  name: string;
  status: TableStatus;
  created_at: string;
  updated_at: string;
};

export type TableSession = {
  id: string;
  table_id: string;
  qr_token: string;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at: string | null;
};

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function listTables(token: string): Promise<Table[]> {
  return apiFetch<Table[]>(`${API_V1_PREFIX}/tables`, {
    headers: authHeaders(token),
  });
}

export function listTableSessions(token: string): Promise<TableSession[]> {
  return apiFetch<TableSession[]>(`${API_V1_PREFIX}/table-sessions`, {
    headers: authHeaders(token),
  });
}

export function openTable(tableId: string | number, token: string): Promise<TableSession> {
  return apiFetch<TableSession>(`${API_V1_PREFIX}/tables/${tableId}/open`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export function closeSession(sessionId: string | number, token: string): Promise<TableSession> {
  return apiFetch<TableSession>(`${API_V1_PREFIX}/table-sessions/${sessionId}/close`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export function markTableCleaned(tableId: string | number, token: string): Promise<Table> {
  return apiFetch<Table>(`${API_V1_PREFIX}/tables/${tableId}/clean`, {
    method: 'POST',
    headers: authHeaders(token),
  });
}
