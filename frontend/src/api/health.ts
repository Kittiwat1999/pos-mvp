import { API_BASE_URL } from '../lib/constants';

export type HealthResponse = {
  status: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Backend health check failed');
  }

  return response.json() as Promise<HealthResponse>;
}
