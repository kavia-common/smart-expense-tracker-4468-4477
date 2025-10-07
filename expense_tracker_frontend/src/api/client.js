/**
 * API client with mock-first behavior.
 * If REACT_APP_USE_MOCK=1 (default), returns local sample data instead of hitting backend.
 * To re-enable backend API, set REACT_APP_USE_MOCK=0 and provide REACT_APP_API_URL.
 */

// Feature flag: mock mode by default
const USE_MOCK = String(process.env.REACT_APP_USE_MOCK ?? '1') === '1';
const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Local mock seed data for immediate dashboard rendering
 */
const mockData = {
  '/accounts': [
    { id: 'acc_1', name: 'Checking', institution: 'Bank A', balance: 2450.32, type: 'checking' },
    { id: 'acc_2', name: 'Savings', institution: 'Bank A', balance: 8100.0, type: 'savings' },
    { id: 'acc_3', name: 'Credit Card', institution: 'Bank B', balance: -320.5, type: 'credit' },
  ],
  '/transactions': [
    { id: 'tx_1', accountId: 'acc_1', date: '2025-10-01', description: 'Groceries', category: 'Food', amount: -82.45 },
    { id: 'tx_2', accountId: 'acc_1', date: '2025-10-02', description: 'Salary', category: 'Income', amount: 3200.0 },
    { id: 'tx_3', accountId: 'acc_3', date: '2025-10-03', description: 'Online Subscription', category: 'Entertainment', amount: -12.99 },
    { id: 'tx_4', accountId: 'acc_1', date: '2025-10-04', description: 'Gas', category: 'Transport', amount: -45.2 },
  ],
  '/budgets': [
    { id: 'bud_1', category: 'Food', amount: 400, spent: 120 },
    { id: 'bud_2', category: 'Transport', amount: 150, spent: 60 },
    { id: 'bud_3', category: 'Entertainment', amount: 100, spent: 30 },
  ],
  '/goals': [
    { id: 'goal_1', name: 'Emergency Fund', targetAmount: 5000, currentAmount: 2200 },
    { id: 'goal_2', name: 'Vacation', targetAmount: 2000, currentAmount: 650 },
  ],
  '/reports': {
    month: '2025-10',
    income: 3200,
    expenses: 980,
    savingsRate: 0.69,
    byCategory: [
      { category: 'Food', amount: 220 },
      { category: 'Transport', amount: 130 },
      { category: 'Entertainment', amount: 75 },
      { category: 'Utilities', amount: 180 },
      { category: 'Other', amount: 375 },
    ],
  },
  '/profile': {
    id: 'user_demo',
    name: 'Demo User',
    email: 'demo@example.com',
    notificationPreferences: { budgets: true, goals: true },
  },
};

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
});

// Simulate latency for mock calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * PUBLIC_INTERFACE
 * Returns true if mock mode is on.
 */
export function isMockMode() {
  return USE_MOCK;
}

/**
 * PUBLIC_INTERFACE
 * Minimal client with GET/POST/PUT
 */
export const apiClient = {
  /** GET: returns mock data when USE_MOCK=1, otherwise calls backend. */
  get: async (endpoint) => {
    if (USE_MOCK) {
      await delay(120);
      if (Object.prototype.hasOwnProperty.call(mockData, endpoint)) {
        return JSON.parse(JSON.stringify(mockData[endpoint]));
      }
      return null;
    }
    const url = `${API_URL}${endpoint}`;
    const res = await fetch(url, { method: 'GET', headers: defaultHeaders() });
    if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
    return res.json();
  },

  /** POST: in mock mode, apply minimal in-memory updates when possible, else no-op */
  post: async (endpoint, body) => {
    if (USE_MOCK) {
      await delay(120);
      if (endpoint === '/budgets') {
        const newItem = { id: `bud_${Date.now()}`, ...body, spent: 0 };
        mockData['/budgets'] = [...(mockData['/budgets'] || []), newItem];
        return JSON.parse(JSON.stringify(newItem));
      }
      if (endpoint === '/goals') {
        const newItem = { id: `goal_${Date.now()}`, currentAmount: 0, ...body };
        mockData['/goals'] = [...(mockData['/goals'] || []), newItem];
        return JSON.parse(JSON.stringify(newItem));
      }
      return body ?? { ok: true };
    }
    const url = `${API_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
    return res.json();
  },

  /** PUT: in mock mode, update local structures */
  put: async (endpoint, body) => {
    if (USE_MOCK) {
      await delay(120);
      if (endpoint.startsWith('/profile')) {
        mockData['/profile'] = { ...(mockData['/profile'] || {}), ...body };
        return JSON.parse(JSON.stringify(mockData['/profile']));
      }
      return body ?? { ok: true };
    }
    const url = `${API_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: defaultHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.status}`);
    return res.json();
  },
};

// Backward-compatible named exports for existing hooks/components that might import these helpers

// PUBLIC_INTERFACE
export async function apiGet(path, config = {}) {
  const data = await apiClient.get(path, config);
  return { data, status: 200 };
}

// PUBLIC_INTERFACE
export async function apiPost(path, body = {}, config = {}) {
  const data = await apiClient.post(path, body, config);
  return { data, status: 200 };
}

// PUBLIC_INTERFACE
export async function apiPut(path, body = {}, config = {}) {
  const data = await apiClient.put(path, body, config);
  return { data, status: 200 };
}

// PUBLIC_INTERFACE
export function isApiEnabled() {
  // API considered enabled only when not in mock mode and API_URL exists
  return !USE_MOCK && Boolean(API_URL);
}

// PUBLIC_INTERFACE
export function setAuthToken() {
  // No-op in mock-first mode; kept for compatibility
}

// PUBLIC_INTERFACE
export function getAuthToken() {
  return null;
}

// PUBLIC_INTERFACE
export function clearAuthToken() {
  // No-op
}

export default apiClient;
