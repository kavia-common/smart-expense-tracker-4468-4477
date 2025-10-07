import React, { useMemo } from 'react';
import useReports from '../hooks/useReports';
import useBudgets from '../hooks/useBudgets';
import useGoals from '../hooks/useGoals';
import SpendingByCategoryChart from './insights/SpendingByCategoryChart';
import IncomeVsExpenseChart from './insights/IncomeVsExpenseChart';
import InsightCards from './insights/InsightCards';

/**
 * PUBLIC_INTERFACE
 * Reports - analytics dashboard with KPIs and charts bound to mock-enabled hooks.
 */
export default function Reports() {
  const { reports, loading, error } = useReports();
  const { budgets } = useBudgets();
  const { goals } = useGoals();

  const spendingByCategory = reports?.spendingByCategory || reports?.spending_by_category || [];
  const incomeVsExpense = reports?.incomeVsExpense || reports?.income_vs_expense || [];

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
      <div className="page-header">
        <h2>Reports</h2>
      </div>

      <InsightCards
        spendingByCategory={spendingByCategory}
        incomeVsExpense={incomeVsExpense}
        goals={goals}
        alerts={budgetAlerts}
      />

      <div className="page-grid">
        <div className="span-6">
          <SpendingByCategoryChart
            data={spendingByCategory}
            loading={loading}
            error={error}
          />
        </div>
        <div className="span-6">
          <IncomeVsExpenseChart
            data={incomeVsExpense}
            loading={loading}
            error={error}
          />
        </div>
      </div>

      {!loading && !error && spendingByCategory.length === 0 && (
        <div className="card">
          <div className="helper">No report data is available yet. Add transactions to see insights.</div>
        </div>
      )}
    </div>
  );
}
