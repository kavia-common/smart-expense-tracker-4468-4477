import React from 'react';
import useTransactions from '../hooks/useTransactions';
import useBudgets from '../hooks/useBudgets';
import useGoals from '../hooks/useGoals';
import useReports from '../hooks/useReports';

/**
 * PUBLIC_INTERFACE
 * Dashboard - overview cards using hooks
 */
export default function Dashboard() {
  const { transactions, loading: loadingTx } = useTransactions();
  const { budgets, loading: loadingBudgets } = useBudgets();
  const { goals, loading: loadingGoals } = useGoals();
  const { spendingByCategory, incomeVsExpense, loading: loadingReports } = useReports();

  return (
    <div className="dashboard">
      <div className="card">
        <h2 className="card-title">Recent Transactions</h2>
        {loadingTx ? (
          <div className="skeleton" style={{ height: 16, width: 180 }} />
        ) : (
          <ul className="list">
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id}>{t.date} • {t.category || t.categoryName} • ${t.amount || t.total}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="card-title">Budgets</h2>
        {loadingBudgets ? (
          <div className="skeleton" style={{ height: 16, width: 180 }} />
        ) : (
          <ul className="list">
            {budgets.slice(0, 5).map((b) => (
              <li key={b.id}>{b.category || b.categoryName}: {b.spent} / {b.limit || b.limit_amount}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="card-title">Goals</h2>
        {loadingGoals ? (
          <div className="skeleton" style={{ height: 16, width: 180 }} />
        ) : (
          <ul className="list">
            {goals.slice(0, 5).map((g) => (
              <li key={g.id}>{g.name}: {g.current_amount || 0} / {g.target_amount || g.target}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="card-title">Reports Snapshot</h2>
        {loadingReports?.spending || loadingReports?.trend ? (
          <div className="skeleton" style={{ height: 16, width: 220 }} />
        ) : (
          <div>
            <div className="helper">Categories: {spendingByCategory?.length || 0} • Periods: {incomeVsExpense?.length || 0}</div>
          </div>
        )}
      </div>
    </div>
  );
}
