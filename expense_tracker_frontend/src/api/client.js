 /**
 * Axios API client with JWT auth, 401 handling, and in-memory token cache.
 * Falls back to mock mode if REACT_APP_API_URL is not set.
 */
import axios from 'axios';

// In-memory token cache synchronized with localStorage
let tokenCache = null;
const TOKEN_KEY = 'auth_token';

// Load cached token from localStorage on module import
try {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) tokenCache = stored;
} catch {
  // ignore SSR or storage errors
}

// PUBLIC_INTERFACE
export function setAuthToken(token) {
  /** Set and persist JWT token */
  tokenCache = token || null;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function getAuthToken() {
  /** Get JWT token from memory cache (fast path), synced with localStorage */
  if (!tokenCache) {
    try {
      tokenCache = localStorage.getItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }
  return tokenCache;
}

// PUBLIC_INTERFACE
export function clearAuthToken() {
  /** Clear JWT token from memory and storage */
  tokenCache = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function isApiEnabled() {
  /** Returns true if backend API URL is configured, otherwise mock mode */
  return Boolean(process.env.REACT_APP_API_URL);
}

const baseURL = process.env.REACT_APP_API_URL || undefined;

// Create axios instance if API is enabled; otherwise export a stub for mock mode usage
export const http = baseURL
  ? axios.create({
      baseURL,
      timeout: 15000,
    })
  : null;

// Attach interceptors only if we have a real client
if (http) {
  // Request: attach Authorization header if token exists
  http.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response: handle 401 by clearing token and redirecting to /login
  http.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      if (status === 401) {
        clearAuthToken();
        try {
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        } catch {
          // ignore
        }
      }
      return Promise.reject(error);
    }
  );
}

// Helper wrappers to allow a unified API for mock vs real modes
// PUBLIC_INTERFACE
export async function apiGet(path, config = {}) {
  /** Perform GET request via axios if API is enabled; mock mode returns placeholder. */
  if (!http) {
    return { data: null, status: 200, mock: true };
  }
  const res = await http.get(path, config);
  return { data: res.data, status: res.status };
}

// PUBLIC_INTERFACE
export async function apiPost(path, body = {}, config = {}) {
  /** Perform POST request via axios if API is enabled; mock mode returns placeholder. */
  if (!http) {
    return { data: null, status: 200, mock: true };
  }
  const res = await http.post(path, body, config);
  return { data: res.data, status: res.status };
}

// PUBLIC_INTERFACE
export async function apiPut(path, body = {}, config = {}) {
  /** Perform PUT request via axios if API is enabled; mock mode returns placeholder. */
  if (!http) {
    return { data: null, status: 200, mock: true };
  }
  const res = await http.put(path, body, config);
  return { data: res.data, status: res.status };
}
