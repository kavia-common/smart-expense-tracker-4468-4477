import React, { useEffect, useMemo, useState } from 'react';
import useTransactions from '../hooks/useTransactions';
import useBudgets from '../hooks/useBudgets';
import useGoals from '../hooks/useGoals';
import useReports from '../hooks/useReports';
import useAlerts from '../hooks/useAlerts';
import { getApi } from '../api/client';
import SpendingByCategoryChart from './insights/SpendingByCategoryChart';
import IncomeVsExpenseChart from './insights/IncomeVsExpenseChart';
import InsightCards from './insights/InsightCards';

/**
 * PUBLIC_INTERFACE
 * Dashboard - overview with summaries and insights charts
 */
export default function Dashboard() {
  const { data: transactions, loading: txLoading, error: txError } = useTransactions();
  const { data: budgets, loading: bLoading, error: bError } = useBudgets();
  const { data: goals, loading: gLoading, error: gError } = useGoals();
  const reports = useReports({ rangeSpending: 'month', rangeIncomeExpense: '3months' });
  const alerts = useAlerts({ spendingByCategory: reports.spendingByCategory, budgets });

  // Simple health status check
  const api = useMemo(() => getApi(), []);
  const [health, setHealth] = useState({ loading: true, status: 'unknown', error: '' });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setHealth((h) => ({ ...h, loading: true, error: '' }));
        const res = await api.get('/health');
        if (!cancelled) {
          setHealth({ loading: false, status: res?.data?.status === 'ok' ? 'ok' : 'error', error: '' });
        }
      } catch (_e) {
        if (!cancelled) setHealth({ loading: false, status: 'error', error: 'Failed to reach API' });
      }
    })();
    return () => { cancelled = true; };
  }, [api]);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>
      <div className="page-grid">
        <section className="card span-12" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong>Health</strong>
          {health.loading ? (
            <span className="helper">Checking API...</span>
          ) : (
            <span className="badge" style={{ background: health.status === 'ok' ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)', color: health.status === 'ok' ? '#16a34a' : '#ef4444' }}>
              API: {health.status}
            </span>
          )}
          {api.isMock && <span className="helper">Using mock data (set REACT_APP_API_URL to connect)</span>}
        </section>

        <section className="card span-4">
          <h3>Recent Transaction</h3>
          {txLoading && <div className="skeleton" style={{height: 16, width: '80%'}} />}
          {txError && <div className="helper" style={{ color: 'var(--color-error)' }}>Error loading transactions</div>}
          {!txLoading && !txError && transactions?.length ? (
            <div className="helper">{transactions[0].category} • ${transactions[0].amount}</div>
          ) : (!txLoading && <div className="helper">No transactions yet</div>)}
        </section>

        <section className="card span-4">
          <h3>Budget Status</h3>
          {bLoading && <div className="skeleton" style={{height: 16, width: '70%'}} />}
          {bError && <div className="helper" style={{ color: 'var(--color-error)' }}>Error loading budgets</div>}
          {!bLoading && !bError && budgets?.length ? (
            <div className="helper">
              {(() => {
                const b = budgets[0];
                const spent = Number(b.spent || 0);
                const limit = Number(b.limit || b.limit_amount || 0);
                const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                return `${b.category || b.categoryName || 'Budget'} • ${pct}% used`;
              })()}
            </div>
          ) : (!bLoading && <div className="helper">No budgets yet</div>)}
        </section>

        <section className="card span-4">
          <h3>Goal Progress</h3>
          {gLoading && <div className="skeleton" style={{height: 16, width: '60%'}} />}
          {gError && <div className="helper" style={{ color: 'var(--color-error)' }}>Error loading goals</div>}
          {!gLoading && !gError && goals?.length ? (
            <div className="helper">
              {(() => {
                const g = goals[0];
                const name = g.name || 'Goal';
                const target = Number(g.target || g.target_amount || 0);
                const progress = Number(g.progress || g.current_amount || 0);
                return `${name} • $${progress}/${target}`;
              })()}
            </div>
          ) : (!gLoading && <div className="helper">Set your first goal</div>)}
        </section>

        {/* Insight cards */}
        <section className="span-12">
          <InsightCards
            spendingByCategory={reports.spendingByCategory}
            incomeVsExpense={reports.incomeVsExpense}
            goals={goals}
            alerts={alerts.alerts}
          />
        </section>

        {/* Charts Grid */}
        <section className="span-6">
          <SpendingByCategoryChart
            data={reports.spendingByCategory}
            loading={reports.loading.spending}
            error={reports.error.spending}
          />
        </section>
        <section className="span-6">
          <IncomeVsExpenseChart
            data={reports.incomeVsExpense}
            loading={reports.loading.trend}
            error={reports.error.trend}
          />
        </section>
      </div>
    </div>
  );
}
