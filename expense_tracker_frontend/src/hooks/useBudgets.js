import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApi, endpoints } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useBudgets - fetch and manage budgets with create/delete, optimistic updates, rollback, and refresh.
 */
export default function useBudgets() {
  const api = useMemo(() => getApi(), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchList = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(endpoints.budgets, { signal });
      // normalize for UI robustness
      const rows = (res.data || []).map(b => ({
        ...b,
        limit: Number(b.limit ?? b.limit_amount ?? b.limitAmount ?? 0),
        spent: Number(b.spent ?? 0),
        categoryName: b.categoryName || b.category || b.name
      }));
      setData(rows);
    } catch (e) {
      if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
        setError('Failed to load');
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const controller = new AbortController();
    fetchList(controller.signal);
    return () => controller.abort();
  }, [fetchList]);

  const add = useCallback(async (payload) => {
    setIsSubmitting(true);
    // payload expects: { user_id, category_id, month, limit_amount }
    const tempId = `tmp_b_${Date.now()}`;
    const optimistic = {
      id: tempId,
      ...payload,
      limit_amount: payload.limit_amount,
      spent: 0,
      category: payload.categoryName
    };
    setData((d) => [optimistic, ...d]);
    try {
      const res = await api.post(endpoints.budgets, payload);
      const created = res.data;
      setData((d) => d.map(item => item.id === tempId ? created : item));
      return { ok: true };
    } catch (e) {
      setData((d) => d.filter(item => item.id !== tempId));
      return { ok: false, error: e?.response?.data?.error || 'Failed to create budget' };
    } finally {
      setIsSubmitting(false);
    }
  }, [api]);

  const remove = useCallback(async (id) => {
    if (!id) return { ok: false };
    const prev = data;
    setData((d) => d.filter(b => b.id !== id));
    try {
      await api.delete(`${endpoints.budgets}/${id}`);
      return { ok: true };
    } catch (_e) {
      setData(prev);
      return { ok: false, error: 'Failed to delete budget' };
    }
  }, [api, data]);

  const refresh = useCallback(async () => {
    await fetchList();
  }, [fetchList]);

  return { data, loading, error, add, remove, refresh, isSubmitting, isMock: api.isMock, baseURL: api.baseURL };
}
