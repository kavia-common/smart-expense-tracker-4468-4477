import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApi, endpoints } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useTransactions - fetches and manages transactions list with add helper
 */
export default function useTransactions() {
  const api = useMemo(() => getApi(), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchList = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(endpoints.transactions, { signal });
      setData(res.data || []);
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
    try {
      const res = await api.post(endpoints.transactions, payload);
      setData((d) => [res.data, ...d]);
    } catch (e) {
      // swallow for now
    }
  }, [api]);

  return { data, loading, error, add, isMock: api.isMock, baseURL: api.baseURL };
}
