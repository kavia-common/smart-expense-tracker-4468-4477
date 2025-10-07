import React, { useMemo } from 'react';
import useTransactions from '../hooks/useTransactions';
import useBudgets from '../hooks/useBudgets';
import useGoals from '../hooks/useGoals';
import useReports from '../hooks/useReports';
import InsightCards from './insights/InsightCards';
import SpendingByCategoryChart from './insights/SpendingByCategoryChart';
import IncomeVsExpenseChart from './insights/IncomeVsExpenseChart';

/**
 * PUBLIC_INTERFACE
 * Dashboard - overview cards, KPIs and charts bound to mock-enabled hooks.
 */
export default function Dashboard() {
  const { transactions, loading: loadingTx } = useTransactions();
  const { budgets, loading: loadingBudgets } = useBudgets();
  const { goals, loading: loadingGoals } = useGoals();
  const { reports, loading: loadingReports, error: reportsError } = useReports();

  // Derive report parts with fallbacks for mock shape
  const spendingByCategory = reports?.spendingByCategory || reports?.spending_by_category || [];
  const incomeVsExpense = reports?.incomeVsExpense || reports?.income_vs_expense || [];

  // Derived KPIs
  const monthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const totalSpendThisMonth = useMemo(() => {
    // transactions may have amount and direction; consider outflows as spend
    return transactions
      .filter(t => String(t.transaction_date || t.date || '').startsWith(monthKey))
      .filter(t => (t.direction ? t.direction === 'outflow' : true))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions, monthKey]);

  const budgetAlerts = useMemo(() => {
    return (budgets || []).map(b => {
      const limit = Number(b.limit_amount ?? b.limit ?? 0);
      const spent = Number(b.spent ?? 0);
      if (limit > 0 && spent > limit) {
        return {
          severity: 'error',
          message: `${b.categoryName || b.category || 'Category'} over budget by $${(spent - limit).toFixed(2)}`
        };
      }
      if (limit > 0 && spent / limit >= 0.8) {
        return {
          severity: 'warn',
          message: `${b.categoryName || b.category || 'Category'} at ${Math.round((spent / limit) * 100)}% of budget`
        };
      }
      return null;
    }).filter(Boolean);
  }, [budgets]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* KPI/Insight cards */}
      <InsightCards
        spendingByCategory={spendingByCategory}
        incomeVsExpense={incomeVsExpense}
        goals={goals}
        alerts={budgetAlerts}
      />

      {/* Monthly Spend quick card */}
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <div className="section-header">
          <h3 className="m-0">This Month's Spend</h3>
          {loadingTx && <span className="helper">Loading…</span>}
        </div>
        {loadingTx ? (
          <div className="skeleton" style={{ height: 16, width: '40%' }} />
        ) : (
          <div style={{ fontSize: 28, fontWeight: 800 }}>${totalSpendThisMonth.toFixed(2)}</div>
        )}
      </div>

      {/* Charts grid */}
      <div className="page-grid">
        <div className="span-6">
          <SpendingByCategoryChart
            data={spendingByCategory}
            loading={loadingReports}
            error={reportsError}
          />
        </div>
        <div className="span-6">
          <IncomeVsExpenseChart
            data={incomeVsExpense}
            loading={loadingReports}
            error={reportsError}
          />
        </div>
      </div>

      {/* Recent transactions table */}
      <div className="card">
        <div className="section-header">
          <h3 className="m-0">Recent Transactions</h3>
        </div>
        {loadingTx ? (
          <div className="skeleton" style={{ height: 16, width: '60%' }} />
        ) : (
          <div className="list">
            {transactions.slice(0, 6).map((t) => {
              const date = t.transaction_date || t.date;
              const cat = t.category_name || t.category || t.categoryName || '—';
              const amt = Number(t.amount || 0);
              return (
                <div
                  key={t.id}
                  className="gap-2"
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}
                >
                  <span className="helper">{date} • {cat}</span>
                  <strong>${amt.toFixed ? amt.toFixed(2) : amt}</strong>
                </div>
              );
            })}
            {!transactions.length && <div className="helper">No transactions yet.</div>}
          </div>
        )}
      </div>

      {/* Budgets snapshot */}
      <div className="card">
        <div className="section-header">
          <h3 className="m-0">Budgets Snapshot</h3>
          {loadingBudgets && <span className="helper">Loading…</span>}
        </div>
        {loadingBudgets ? (
          <div className="skeleton" style={{ height: 12, width: '50%' }} />
        ) : (
          <div className="list">
            {(budgets || []).slice(0, 5).map((b) => {
              const limit = Number(b.limit_amount ?? b.limit ?? 0);
              const spent = Number(b.spent ?? 0);
              const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const over = spent > limit;
              return (
                <div key={b.id}>
                  <div style={{ fontWeight: 700 }}>{b.categoryName || b.category || 'Category'}</div>
                  <div className="helper">{monthKey}</div>
                  <div className="mt-2" style={{ height: 8, background: '#eef2f7', borderRadius: 8, overflow: 'hidden', maxWidth: 420 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: over ? '#EF4444' : '#2563EB' }} />
                  </div>
                  <div className="helper">${spent.toFixed ? spent.toFixed(2) : spent} / ${limit.toFixed ? limit.toFixed(2) : limit}</div>
                </div>
              );
            })}
            {!budgets?.length && <div className="helper">No budgets configured.</div>}
          </div>
        )}
      </div>

      {/* Goals snapshot */}
      <div className="card">
        <div className="section-header">
          <h3 className="m-0">Goals Snapshot</h3>
          {loadingGoals && <span className="helper">Loading…</span>}
        </div>
        {loadingGoals ? (
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
        ) : (
          <div className="list">
            {(goals || []).slice(0, 5).map((g) => {
              const target = Number(g.target_amount ?? g.target ?? 0);
              const current = Number(g.current_amount ?? g.progress ?? 0);
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              return (
                <div key={g.id}>
                  <div style={{ fontWeight: 700 }}>{g.name}</div>
                  <div className="helper">{g.target_date ? `Target by ${g.target_date}` : 'No target date'}</div>
                  <div className="mt-2" style={{ height: 8, background: '#eef2f7', borderRadius: 8, overflow: 'hidden', maxWidth: 420 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#34D399' }} />
                  </div>
                  <div className="helper">${current.toFixed ? current.toFixed(2) : current} / ${target.toFixed ? target.toFixed(2) : target}</div>
                </div>
              );
            })}
            {!goals?.length && <div className="helper">No goals yet.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
