import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from '../lib/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('cc_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user: u }) => {
        setUser(u);
        localStorage.setItem('cc_user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await authApi.login({ email, password });
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user: u } = await authApi.register(payload);
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const loginWithGoogle = useCallback(async (googlePayload) => {
    const { token, user: u } = await authApi.google(googlePayload);
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async () => {
    const { user: u } = await authApi.me();
    setUser(u);
    localStorage.setItem('cc_user', JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
