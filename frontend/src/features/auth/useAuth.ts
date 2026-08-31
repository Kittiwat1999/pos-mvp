import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../api/auth';
import { clearAuthState, readAuthState, writeAuthState } from '../../store/authStore';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const state = readAuthState();
    if (!state.token) {
      setLoading(false);
      return;
    }

    setToken(state.token);
    setUsername(state.username);

    getCurrentUser(state.token)
      .then((user) => setUsername(user.username))
      .catch(() => {
        clearAuthState();
        setToken(null);
        setUsername(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (nextToken: string, nextUsername: string) => {
    setToken(nextToken);
    setUsername(nextUsername);
    writeAuthState({ token: nextToken, username: nextUsername });
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    clearAuthState();
  };

  return { token, username, loading, login, logout };
}
