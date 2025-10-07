import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useAlerts - manages budget/goal alert feed, with graceful mock support via client
 */
export default function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async (signal) => {
    setLoading(true);
    try {
      const { data } = await apiGet('/reports/alerts', { signal });
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      // keep alerts as-is on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAlerts(controller.signal);
    return () => controller.abort();
  }, [fetchAlerts]);

  // Example of acknowledging alert if backend supports it
  const acknowledge = useCallback(async (id) => {
    try {
      await apiPost(`/alerts/${id}/ack`);
      setAlerts((arr) => arr.filter((a) => a.id !== id));
    } catch {
      // ignore
    }
  }, []);

  return { alerts, loading, refresh: fetchAlerts, acknowledge };
}
