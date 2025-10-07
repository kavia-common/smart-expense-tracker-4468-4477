import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApi } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useReports - fetch spendingByCategory and incomeVsExpense reports
 * Provides loading/error states and mock fallback if API URL is not set.
 */
export default function useReports({ rangeSpending = 'month', rangeIncomeExpense = '3months' } = {}) {
  const api = useMemo(() => getApi(), []);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [incomeVsExpense, setIncomeVsExpense] = useState([]);
  const [loading, setLoading] = useState({ spending: true, trend: true });
  const [error, setError] = useState({ spending: '', trend: '' });

  const fetchSpending = useCallback(async (signal) => {
    try {
      setLoading((s) => ({ ...s, spending: true }));
      setError((e) => ({ ...e, spending: '' }));
      const res = await api.get(`/reports/spending-by-category?range=${encodeURIComponent(rangeSpending)}`, { signal });
      setSpendingByCategory(res.data || []);
    } catch (e) {
      if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
        setError((er) => ({ ...er, spending: 'Failed to load spending by category' }));
        // Mock-friendly fallback for UI demonstration
        if (api.isMock) {
          setSpendingByCategory([
            { categoryName: 'Food & Dining', total: 180.25, currency: 'USD' },
            { categoryName: 'Groceries', total: 240.10, currency: 'USD' },
            { categoryName: 'Transport', total: 65.80, currency: 'USD' }
          ]);
        }
      }
    } finally {
      setLoading((s) => ({ ...s, spending: false }));
    }
  }, [api, rangeSpending]);

  const fetchTrend = useCallback(async (signal) => {
    try {
      setLoading((s) => ({ ...s, trend: true }));
      setError((e) => ({ ...e, trend: '' }));
      const res = await api.get(`/reports/income-vs-expense?range=${encodeURIComponent(rangeIncomeExpense)}`, { signal });
      setIncomeVsExpense(res.data || []);
    } catch (e) {
      if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
        setError((er) => ({ ...er, trend: 'Failed to load income vs expense' }));
        if (api.isMock) {
          setIncomeVsExpense([
            { period: '2025-01', income: 5500, expense: 3200, net: 2300 },
            { period: '2025-02', income: 5500, expense: 3100, net: 2400 },
            { period: '2025-03', income: 5500, expense: 3450, net: 2050 }
          ]);
        }
      }
    } finally {
      setLoading((s) => ({ ...s, trend: false }));
    }
  }, [api, rangeIncomeExpense]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSpending(controller.signal);
    fetchTrend(controller.signal);
    return () => controller.abort();
  }, [fetchSpending, fetchTrend]);

  return {
    spendingByCategory,
    incomeVsExpense,
    loading,
    error,
    isMock: api.isMock
  };
}
