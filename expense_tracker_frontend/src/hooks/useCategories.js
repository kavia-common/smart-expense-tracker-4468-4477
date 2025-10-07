import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useCategories - fetch categories with cancellation and error state
 */
export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiGet('/categories', { signal: controller.signal });
        if (!abort && data) setCategories(data);
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
  }, []);

  return { categories, loading, error };
}
