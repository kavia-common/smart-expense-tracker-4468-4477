import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthToken, getAuthToken, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

/**
 * AuthProvider manages JWT token and user basics, exposing login/logout.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const t = getAuthToken();
      if (t) setToken(t);
    } catch {
      // ignore
    }
    setInitializing(false);
  }, []);

  // PUBLIC_INTERFACE
  const login = async (jwtToken, userBasics) => {
    /** Persist token and set user basics */
    setAuthToken(jwtToken);
    setToken(jwtToken);
    if (userBasics) setUser(userBasics);
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    /** Clear token and user, redirect to login */
    clearAuthToken();
    setToken(null);
    setUser(null);
    try {
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    } catch {
      // ignore
    }
  };

  // PUBLIC_INTERFACE
  const setUserFromToken = (userBasics) => {
    /** Set user basics derived from token/response */
    setUser(userBasics || null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      initializing,
      isAuthenticated: !!token,
      login,
      logout,
      setUserFromToken,
    }),
    [token, user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
