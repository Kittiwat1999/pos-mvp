import { useCallback, useEffect, useRef, useState } from 'react';
import { ORDER_POLLING_INTERVAL_MS } from '../lib/constants';

type PollingOptions = {
  intervalMs?: number;
  enabled?: boolean;
};

export function usePolling<T>(
  fetcher: () => Promise<T>,
  { intervalMs = ORDER_POLLING_INTERVAL_MS, enabled = true }: PollingOptions = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(enabled);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);

    try {
      const result = await fetcher();
      if (currentRequestId === requestId.current) {
        setData(result);
        setError(null);
      }
    } catch (cause) {
      if (currentRequestId === requestId.current) {
        setError(cause instanceof Error ? cause : new Error('Polling request failed'));
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    void refresh();
    const intervalId = window.setInterval(() => void refresh(), intervalMs);
    return () => {
      requestId.current += 1;
      window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs, refresh]);

  return { data, error, loading, refresh };
}
