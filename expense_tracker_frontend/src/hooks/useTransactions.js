import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useTransactions - fetch transactions with cancellation and error state
 */
export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiGet('/transactions', { signal: controller.signal });
        if (!abort && data) setTransactions(data);
      } catch (e) {
        if (!abort) setError('Failed to load transactions.');
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

  return { transactions, loading, error };
}
