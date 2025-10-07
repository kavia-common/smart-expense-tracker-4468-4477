import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useCategories - fetch categories with cancellation and error state
 */
export default function useCategories() {
  const [categories, setCategories] = useState([]);
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
          const data = await mockApi.getCategories();
          if (!abort && data) setCategories(data);
        } else {
          const { data } = await apiGet('/categories', { signal: controller.signal });
          if (!abort && data) setCategories(data);
        }
      } catch (e) {
        if (!abort) setError('Failed to load categories.');
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

  return { categories, loading, error };
}
