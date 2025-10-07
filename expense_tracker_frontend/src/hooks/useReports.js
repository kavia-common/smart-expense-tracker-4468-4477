import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useReports - fetch aggregate reports with cancellation and error state
 */
export default function useReports() {
  const [reports, setReports] = useState(null);
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
          const data = await mockApi.getReports();
          if (!abort) setReports(data);
        } else {
          const { data } = await apiGet('/reports', { signal: controller.signal });
          if (!abort) setReports(data);
        }
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
  }, [useMock]);

  return { reports, loading, error };
}
