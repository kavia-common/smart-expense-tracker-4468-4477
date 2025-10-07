import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useBudgets - fetch budgets with cancellation and error state
 */
export default function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiGet('/budgets', { signal: controller.signal });
        if (!abort && data) setBudgets(data);
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
  }, []);

  return { budgets, loading, error };
}
