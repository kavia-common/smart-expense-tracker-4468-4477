import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useTransactions - fetch transactions with cancellation and error state
 */
export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
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
          const data = await mockApi.getTransactions();
          if (!abort && data) setTransactions(data);
        } else {
          const { data } = await apiGet('/transactions', { signal: controller.signal });
          if (!abort && data) setTransactions(data);
        }
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
  }, [useMock]);

  return { transactions, loading, error };
}
