import { useEffect, useState } from 'react';
import { getHealth } from '../../api/health';

export default function BackendHealth() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unavailable'>('checking');

  useEffect(() => {
    let active = true;
    getHealth()
      .then((result) => {
        if (active && result.status === 'ok') setStatus('healthy');
        else if (active) setStatus('unavailable');
      })
      .catch(() => {
        if (active) setStatus('unavailable');
      });

    return () => {
      active = false;
    };
  }, []);

  const label = {
    checking: 'Checking backend…',
    healthy: 'Backend: healthy',
    unavailable: 'Backend: unavailable',
  }[status];

  return <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{label}</p>;
}
