import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApi, endpoints } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useTransactions - fetches and manages transactions with create/delete, optimistic updates, rollback, and categories list.
 */
export default function useTransactions() {
  const api = useMemo(() => getApi(), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // simple local categories list for selection (would come from backend in full app)
  const categories = useMemo(() => ([
    { id: 'food', name: 'Food & Dining' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'transport', name: 'Transport' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'utilities', name: 'Utilities' },
    { id: 'rent', name: 'Rent' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'travel', name: 'Travel' },
    { id: 'misc', name: 'Misc' },
  ]), []);

  const fetchList = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(endpoints.transactions, { signal });
      // Normalize shape for UI tolerance
      const rows = (res.data || []).map(t => ({
        ...t,
        date: t.transaction_date || t.date,
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
    // Optimistic insert at top with temp id
    const tempId = `tmp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      ...payload,
      transaction_date: payload.transaction_date || new Date().toISOString().slice(0,10)
    };
    setData((d) => [optimistic, ...d]);
    try {
      const res = await api.post(endpoints.transactions, payload);
      const created = res.data;
      setData((d) => d.map(item => item.id === tempId ? created : item));
      return true;
    } catch (e) {
      // rollback
      setData((d) => d.filter(item => item.id !== tempId));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [api]);

  const remove = useCallback(async (id) => {
    if (!id) return;
    // Optimistic removal
    const prev = data;
    setData((d) => d.filter(item => item.id !== id));
    try {
      await api.delete(`${endpoints.transactions}/${id}`);
      return true;
    } catch (e) {
      // rollback
      setData(prev);
      return false;
    }
  }, [api, data]);

  return { data, loading, error, add, remove, categories, isSubmitting, isMock: api.isMock, baseURL: api.baseURL };
}
