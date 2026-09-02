import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../api/auth';
import { clearAuthState, readAuthState, writeAuthState } from '../../store/authStore';

let authBootstrapPromise: Promise<void> | null = null;
let verifiedToken: string | null = null;

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const state = readAuthState();

    if (!state.token) {
      setToken(null);
      setUsername(null);
      setLoading(false);
      return;
    }

    setToken(state.token);
    setUsername(state.username);

    if (verifiedToken === state.token) {
      setLoading(false);
      return;
    }

    if (authBootstrapPromise) {
      authBootstrapPromise
        .then(() => {
          const nextState = readAuthState();
          setToken(nextState.token ?? null);
          setUsername(nextState.username ?? null);
        })
        .catch(() => {
          setToken(null);
          setUsername(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    authBootstrapPromise = getCurrentUser(state.token)
      .then((user) => {
        verifiedToken = state.token;
        const nextUsername = user.username ?? state.username;
        setUsername(nextUsername);
        writeAuthState({ token: state.token, username: nextUsername });
      })
      .catch(() => {
        verifiedToken = null;
        clearAuthState();
        setToken(null);
        setUsername(null);
      })
      .finally(() => {
        setLoading(false);
        authBootstrapPromise = null;
      });
  }, []);

  const login = (nextToken: string, nextUsername: string) => {
    verifiedToken = nextToken;
    setToken(nextToken);
    setUsername(nextUsername);
    writeAuthState({ token: nextToken, username: nextUsername });
  };

  const logout = () => {
    verifiedToken = null;
    authBootstrapPromise = null;
    setToken(null);
    setUsername(null);
    clearAuthState();
  };

  return { token, username, loading, login, logout };
}
