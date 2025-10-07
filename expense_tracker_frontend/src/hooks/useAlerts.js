import { useEffect, useMemo, useState } from 'react';
import { getApi } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useAlerts - fetches alerts if available; otherwise computes basic budget overrun alerts client-side.
 * Accepts optional inputs for spendingByCategory and budgets to compute overruns.
 */
export default function useAlerts({ spendingByCategory = [], budgets = [] } = {}) {
  const api = useMemo(() => getApi(), []);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError('');
        // Prefer backend reports alerts if implemented
        const res = await api.get('/reports/alerts', { signal: controller.signal });
        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length) {
          setAlerts(list);
        } else {
          // Compute client-side overruns as fallback
          const computed = computeOverruns(spendingByCategory, budgets);
          setAlerts(computed);
        }
      } catch (e) {
        if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
          // Fall back to client-side computation on error
          const computed = computeOverruns(spendingByCategory, budgets);
          setAlerts(computed);
          setError('Alerts service not available. Using local computation.');
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, JSON.stringify(spendingByCategory), JSON.stringify(budgets)]);

  return { alerts, loading, error, isMock: api.isMock };
}

function computeOverruns(spendingByCategory, budgets) {
  if (!spendingByCategory?.length || !budgets?.length) return [];
  const byName = new Map(spendingByCategory.map((c) => [c.categoryName, c.total]));
  const alerts = [];
  for (const b of budgets) {
    // budgets in existing UI are mock-shaped; support both shapes
    const name = b.categoryName || b.category || b.name || '';
    const limit = Number(b.limit_amount || b.limit || 0);
    const spent = Number(b.spent ?? byName.get(name) ?? 0);
    if (limit > 0 && spent > limit) {
      const over = Math.round((spent - limit) * 100) / 100;
      alerts.push({
        type: 'BUDGET_OVERRUN',
        message: `${name} exceeded by $${over}`,
        severity: 'error',
        categoryName: name,
        spent,
        limit
      });
    } else if (limit > 0 && spent > 0 && spent > limit * 0.9) {
      alerts.push({
        type: 'BUDGET_NEAR_LIMIT',
        message: `${name} at ${Math.round((spent / limit) * 100)}% of budget`,
        severity: 'warning',
        categoryName: name,
        spent,
        limit
      });
    }
  }
  return alerts;
}
