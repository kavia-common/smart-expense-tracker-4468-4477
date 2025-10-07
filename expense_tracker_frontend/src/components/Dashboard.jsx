import React, { useEffect, useMemo, useState } from 'react';
import useTransactions from '../hooks/useTransactions';
import useBudgets from '../hooks/useBudgets';
import useGoals from '../hooks/useGoals';
import { getApi } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * Dashboard - overview with summaries
 */
export default function Dashboard() {
  const { data: transactions, loading: txLoading, error: txError } = useTransactions();
  const { data: budgets, loading: bLoading, error: bError } = useBudgets();
  const { data: goals, loading: gLoading, error: gError } = useGoals();

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
          {txError && <div className="helper">Error loading transactions</div>}
          {!txLoading && !txError && transactions?.length ? (
            <div className="helper">{transactions[0].category} • ${transactions[0].amount}</div>
          ) : (!txLoading && <div className="helper">No transactions yet</div>)}
        </section>

        <section className="card span-4">
          <h3>Budget Status</h3>
          {bLoading && <div className="skeleton" style={{height: 16, width: '70%'}} />}
          {bError && <div className="helper">Error loading budgets</div>}
          {!bLoading && !bError && budgets?.length ? (
            <div className="helper">{budgets[0].category} • {Math.round((budgets[0].spent/budgets[0].limit)*100)}% used</div>
          ) : (!bLoading && <div className="helper">No budgets yet</div>)}
        </section>

        <section className="card span-4">
          <h3>Goal Progress</h3>
          {gLoading && <div className="skeleton" style={{height: 16, width: '60%'}} />}
          {gError && <div className="helper">Error loading goals</div>}
          {!gLoading && !gError && goals?.length ? (
            <div className="helper">{goals[0].name} • ${goals[0].progress}/${goals[0].target}</div>
          ) : (!gLoading && <div className="helper">Set your first goal</div>)}
        </section>

        <section className="card span-12">
          <h3>Insights</h3>
          <div className="helper">Insights will appear here once there is more data.</div>
        </section>
      </div>
    </div>
  );
}
