import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useBudgets - fetch budgets with cancellation and error state
 */
export default function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const useMock = useMemo(
    () => String(process.env.REACT_APP_USE_MOCK || 'true').toLowerCase() === 'true',
    []
  );

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        if (useMock) {
          const mockApi = await import('../mock/api');
          const data = await mockApi.getBudgets();
          if (!abort && data) setBudgets(data);
        } else {
          const { data } = await apiGet('/budgets', { signal: controller.signal });
          if (!abort && data) setBudgets(data);
        }
      } catch (e) {
        if (!abort) setError('Failed to load budgets.');
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => {
      abort = true;
      controller.abort();
    };
  }, [useMock]);

  return { budgets, loading, error };
}
