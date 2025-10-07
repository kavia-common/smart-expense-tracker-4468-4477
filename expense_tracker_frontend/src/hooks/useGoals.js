import { useEffect, useMemo, useState } from 'react';
import { getApi, endpoints } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useGoals - fetch and manage goals with create/delete, optimistic updates, rollback, and refresh.
 */
export default function useGoals() {
  const api = useMemo(() => getApi(), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(endpoints.goals, { signal: controller.signal });
        const list = Array.isArray(res.data) ? res.data : [];
        setData(list);
      } catch (e) {
        if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
          setError('Failed to load');
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [api]);

  async function refresh() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(endpoints.goals);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (_e) {
      setError('Failed to refresh goals');
    } finally {
      setLoading(false);
    }
  }

  async function add(payload) {
    // payload expects: { user_id, name, target_amount, current_amount?, target_date? }
    setIsSubmitting(true);
    const tempId = `tmp_g_${Date.now()}`;
    const optimistic = {
      id: tempId,
      ...payload
    };
    setData((d) => [optimistic, ...d]);
    try {
      const res = await api.post(endpoints.goals, payload);
      const created = res.data;
      setData((d) => d.map(g => g.id === tempId ? created : g));
      return { ok: true, data: created };
    } catch (e) {
      setData((d) => d.filter(g => g.id !== tempId));
      return { ok: false, error: e?.response?.data?.error || 'Failed to create goal' };
    } finally {
      setIsSubmitting(false);
    }
  }

  async function remove(id) {
    if (!id) return { ok: false };
    const prev = data;
    setData((d) => d.filter(g => g.id !== id));
    try {
      await api.delete(`${endpoints.goals}/${id}`);
      return { ok: true };
    } catch (_e) {
      setData(prev);
      return { ok: false, error: 'Failed to delete goal' };
    }
  }

  return { data, loading, error, add, remove, refresh, isSubmitting, isMock: api.isMock, baseURL: api.baseURL };
}
