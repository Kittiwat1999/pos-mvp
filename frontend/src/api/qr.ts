import { apiFetch } from './client';

export type QrSession = {
  session_id: string;
  table_id: string;
  table_name?: string;
  status: 'OPEN' | 'CLOSED';
};

export function resolveQrToken(token: string): Promise<QrSession> {
  return apiFetch<QrSession>(`/qr/${encodeURIComponent(token)}`);
}
