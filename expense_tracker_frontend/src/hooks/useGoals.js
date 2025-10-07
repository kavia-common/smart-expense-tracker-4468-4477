import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useGoals - fetch goals with cancellation and error state
 */
export default function useGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiGet('/goals', { signal: controller.signal });
        if (!abort && data) setGoals(data);
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
  }, []);

  return { goals, loading, error };
}
