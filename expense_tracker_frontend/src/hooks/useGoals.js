import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useGoals - fetch goals with cancellation and error state
 */
export default function useGoals() {
  const [goals, setGoals] = useState([]);
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
          const data = await mockApi.getGoals();
          if (!abort && data) setGoals(data);
        } else {
          const { data } = await apiGet('/goals', { signal: controller.signal });
          if (!abort && data) setGoals(data);
        }
      } catch (e) {
        if (!abort) setError('Failed to load goals.');
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

  return { goals, loading, error };
}
