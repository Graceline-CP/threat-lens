import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

/**
 * useAuth — central auth hook.
 *
 * Returns:
 *   user          — Firebase User object or null
 *   loading       — true while auth state is resolving
 *   getToken()    — async fn that returns a fresh ID token string
 *   authedFetch() — fetch() wrapper that injects Authorization header
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const getToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken(/* forceRefresh */ false);
  }, [user]);

  const authedFetch = useCallback(
    async (url, options = {}) => {
      const token = await getToken();
      const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      return fetch(url, { ...options, headers });
    },
    [getToken]
  );

  return { user, loading, getToken, authedFetch };
}