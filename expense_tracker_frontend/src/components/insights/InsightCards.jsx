import React, { useMemo } from 'react';

/**
 * PUBLIC_INTERFACE
 * InsightCards - quick insights row
 * Props:
 *  - spendingByCategory: [{categoryName,total}]
 *  - incomeVsExpense: [{period,income,expense,net}]
 *  - goals: list (optional) to compute savings progress
 *  - alerts: computed list for budget overruns
 */
export default function InsightCards({ spendingByCategory = [], incomeVsExpense = [], goals = [], alerts = [] }) {
  const currentNet = useMemo(() => {
    if (!incomeVsExpense?.length) return 0;
    const last = incomeVsExpense[incomeVsExpense.length - 1];
    return Number(last?.net || 0);
  }, [incomeVsExpense]);

  const topCategory = useMemo(() => {
    if (!spendingByCategory?.length) return null;
    const sorted = [...spendingByCategory].sort((a, b) => Number(b.total) - Number(a.total));
    return sorted[0] || null;
  }, [spendingByCategory]);

  const savingsProgress = useMemo(() => {
    if (!goals?.length) return { name: 'Savings', pct: 0 };
    const g = goals[0];
    const target = Number(g.target_amount || g.target || 0);
    const current = Number(g.current_amount || g.progress || 0);
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return { name: g.name || 'Savings', pct };
  }, [goals]);

  return (
    <div className="page-grid">
      <div className="card span-4" style={{ borderTop: '4px solid #2563EB' }}>
        <div className="helper">Net (current period)</div>
        <div className="mt-2" style={{ fontSize: 24, fontWeight: 800 }}>${currentNet.toLocaleString()}</div>
        <div className="helper">Income - Expense</div>
      </div>

      <div className="card span-4" style={{ borderTop: '4px solid #F59E0B' }}>
        <div className="helper">Top Category</div>
        <div className="mt-2" style={{ fontSize: 18, fontWeight: 700 }}>
          {topCategory ? `${topCategory.categoryName}` : '—'}
        </div>
        <div className="helper">{topCategory ? `$${Number(topCategory.total).toFixed(2)}` : 'No spend yet'}</div>
      </div>

      <div className="card span-4" style={{ borderTop: '4px solid #34D399' }}>
        <div className="helper">{savingsProgress.name}</div>
        <div className="mt-2" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <div style={{ height: 10, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${savingsProgress.pct}%`, height: '100%', background: '#34D399' }} />
          </div>
          <div className="helper">{savingsProgress.pct}% towards goal</div>
        </div>
      </div>

      {alerts?.length > 0 && (
        <div
          className="card span-12"
          style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.25)' }}
        >
          <strong style={{ color: '#EF4444' }}>Budget Alerts</strong>
          <div className="list mt-2">
            {alerts.slice(0, 3).map((a, idx) => (
              <div key={idx} className="helper" style={{ color: a.severity === 'error' ? '#EF4444' : '#F59E0B' }}>
                • {a.message}
              </div>
            ))}
            {alerts.length > 3 && <div className="helper">{alerts.length - 3} more…</div>}
          </div>
        </div>
      )}
    </div>
  );
}
