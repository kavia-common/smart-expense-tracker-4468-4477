import React, { createContext, useContext, useMemo } from 'react';

/**
 * No-op AuthContext since authentication is disabled.
 * Exposes a stable API surface so existing components don't crash.
 */
const AuthContext = createContext({
  token: null,
  user: { id: 'user_demo', name: 'Demo User', email: 'demo@example.com' },
  initializing: false,
  isAuthenticated: true,
  login: () => {},
  logout: () => {},
  setUserFromToken: () => {},
});

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  const value = useMemo(
    () => ({
      token: null,
      user: { id: 'user_demo', name: 'Demo User', email: 'demo@example.com' },
      initializing: false,
      isAuthenticated: true,
      login: () => {},
      logout: () => {},
      setUserFromToken: () => {},
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  return useContext(AuthContext);
}
