import { useEffect, useState } from 'react';
import { resolveQrToken, type QrSession } from '../api/qr';

export function useQrSession(sessionToken: string) {
  const [session, setSession] = useState<QrSession | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionToken));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSession(null);
    setError(null);

    if (!sessionToken) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    resolveQrToken(sessionToken)
      .then((result) => { if (!cancelled) setSession(result); })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause : new Error('This QR code is invalid or expired'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [sessionToken]);

  return { session, sessionId: session?.session_id ?? '', loading, error };
}
