import { useEffect, useMemo, useState } from 'react';
import { getApi, endpoints } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useBudgets - fetch budgets with loading and error state
 */
export default function useBudgets() {
  const api = useMemo(() => getApi(), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(endpoints.budgets, { signal: controller.signal });
        setData(res.data || []);
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

  return { data, loading, error, isMock: api.isMock };
}
