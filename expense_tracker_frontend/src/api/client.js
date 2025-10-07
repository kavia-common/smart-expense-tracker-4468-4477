import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '';
const USE_MOCK = !BASE_URL;

// Create axios instance only if we have a BASE_URL
const http = BASE_URL
  ? axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    })
  : null;

/**
 * PUBLIC_INTERFACE
 * getApi - returns a simple API interface with get/post/put/delete.
 * Falls back to mock responses if REACT_APP_API_URL is not set.
 */
export function getApi() {
  if (USE_MOCK) {
    // Minimal mock for initial, backend-not-ready state
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    return {
      /** Mocked GET */
      async get(path) {
        await delay(300);
        if (path.includes('transactions')) {
          return { data: [{ id: 't1', amount: 42.5, category: 'Food', date: '2024-09-12' }] };
        }
        if (path.includes('budgets')) {
          return { data: [{ id: 'b1', category: 'Food', limit: 300, spent: 120 }] };
        }
        if (path.includes('goals')) {
          return { data: [{ id: 'g1', name: 'Emergency Fund', target: 2000, progress: 650 }] };
        }
        return { data: [] };
      },
      /** Mocked POST */
      async post(_path, body) {
        await delay(200);
        return { data: { ...body, id: Math.random().toString(36).slice(2) } };
      },
      /** Mocked PUT */
      async put(_path, body) {
        await delay(200);
        return { data: body };
      },
      /** Mocked DELETE */
      async delete(_path) {
        await delay(200);
        return { data: { ok: true } };
      },
      isMock: true,
      baseURL: ''
    };
  }

  return {
    async get(path, config) {
      const res = await http.get(path, config);
      return res;
    },
    async post(path, data, config) {
      const res = await http.post(path, data, config);
      return res;
    },
    async put(path, data, config) {
      const res = await http.put(path, data, config);
      return res;
    },
    async delete(path, config) {
      const res = await http.delete(path, config);
      return res;
    },
    isMock: false,
    baseURL: BASE_URL
  };
}

/**
 * PUBLIC_INTERFACE
 * endpoints - common endpoint paths to keep usage consistent.
 */
export const endpoints = {
  transactions: '/transactions',
  budgets: '/budgets',
  goals: '/goals',
  reports: '/reports',
  settings: '/settings'
};
