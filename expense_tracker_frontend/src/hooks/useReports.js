import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useReports - fetch aggregate reports with cancellation and error state
 */
export default function useReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiGet('/reports', { signal: controller.signal });
        if (!abort) setReports(data);
      } catch (e) {
        if (!abort) setError('Failed to load reports.');
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

  return { reports, loading, error };
}
