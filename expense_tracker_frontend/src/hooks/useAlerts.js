import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useAlerts - manages budget/goal alert feed, with graceful mock support
 */
export default function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const useMock = useMemo(
    () => String(process.env.REACT_APP_USE_MOCK || 'true').toLowerCase() === 'true',
    []
  );

  const fetchAlerts = useCallback(async (signal) => {
    setLoading(true);
    try {
      if (useMock) {
        const mockApi = await import('../mock/api');
        const data = await mockApi.getAlerts();
        setAlerts(Array.isArray(data) ? data : []);
      } else {
        try {
          const { data } = await apiGet('/alerts', { signal });
          setAlerts(Array.isArray(data) ? data : []);
        } catch {
          const { data } = await apiGet('/reports', { signal });
          setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
        }
      }
    } catch {
      // keep alerts as-is on error
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAlerts(controller.signal);
    return () => controller.abort();
  }, [fetchAlerts]);

  const acknowledge = useCallback(async (id) => {
    try {
      if (useMock) {
        // Remove locally in mock mode
        setAlerts((arr) => arr.filter((a) => a.id !== id));
      } else {
        await apiPost(`/alerts/${id}/ack`);
        setAlerts((arr) => arr.filter((a) => a.id !== id));
      }
    } catch {
      // ignore
    }
  }, [useMock]);

  return { alerts, loading, refresh: fetchAlerts, acknowledge };
}
