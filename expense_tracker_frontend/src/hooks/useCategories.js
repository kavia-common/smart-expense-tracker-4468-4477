import { useEffect, useMemo, useState } from 'react';
import { getApi } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useCategories - fetch categories for selection with graceful fallback to mock if API URL is not set.
 * Options: { type?: 'income'|'expense', user_id?: string, include_defaults?: boolean }
 */
export default function useCategories({ type, user_id, include_defaults } = {}) {
  const api = useMemo(() => getApi(), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (user_id) params.set('user_id', user_id);
        if (typeof include_defaults !== 'undefined') params.set('include_defaults', include_defaults ? 'true' : 'false');
        const qs = params.toString();
        const res = await api.get(`/categories${qs ? `?${qs}` : ''}`, { signal: controller.signal });
        const list = Array.isArray(res.data) ? res.data : [];
        // Normalize shape to {id,name,type}
        const normalized = list.map(c => ({ id: c.id, name: c.name, type: c.type, icon: c.icon, is_default: !!c.is_default }));
        setData(normalized);
      } catch (e) {
        if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
          setError('Failed to load categories');
          // Provide mock list for UX continuity if in mock mode
          if (api.isMock) {
            setData([
              { id: 'food', name: 'Food & Dining', type: 'expense' },
              { id: 'groceries', name: 'Groceries', type: 'expense' },
              { id: 'transport', name: 'Transport', type: 'expense' },
              { id: 'entertainment', name: 'Entertainment', type: 'expense' },
              { id: 'utilities', name: 'Utilities', type: 'expense' },
              { id: 'rent', name: 'Rent', type: 'expense' },
              { id: 'shopping', name: 'Shopping', type: 'expense' },
              { id: 'travel', name: 'Travel', type: 'expense' },
              { id: 'misc', name: 'Misc', type: 'expense' }
            ]);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [api, type, user_id, include_defaults]);

  return { data, loading, error, isMock: api.isMock };
}
