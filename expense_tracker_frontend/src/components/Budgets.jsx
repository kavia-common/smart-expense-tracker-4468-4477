import React from 'react';
import useBudgets from '../hooks/useBudgets';

/**
 * PUBLIC_INTERFACE
 * Budgets - utilization table with inline bars, loading/empty states.
 */
export default function Budgets() {
  const { budgets, loading, error } = useBudgets();

  const fmtMoney = (n) => {
    const v = Number(n || 0);
    return v.toFixed ? v.toFixed(2) : v;
  };

  const monthKey = new Date().toISOString().slice(0,7);

  return (
    <div>
      <div className="page-header">
        <h2>Budgets</h2>
      </div>

      <div className="card">
        <div className="section-header">
          <h3 className="m-0">Budget Utilization</h3>
          {loading && <span className="helper">Loading…</span>}
        </div>
        {loading && <div className="skeleton" style={{height: 16, width: '40%'}} />}
        {error && <div className="helper" style={{ color: 'var(--color-error)' }}>Failed to load budgets</div>}
        {!loading && !error && (
          <>
            <div className="list">
              {budgets.map(b => {
                const limit = Number(b.limit_amount ?? b.limit ?? 0);
                const spent = Number(b.spent ?? 0);
                const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
                const over = spent > limit;
                return (
                  <div key={b.id}>
                    <div style={{ fontWeight: 700 }}>{b.categoryName || b.category || 'Category'}</div>
                    <div className="helper">{(b.month || monthKey).slice(0,7)}</div>
                    <div className="mt-2" style={{ height: 8, background: '#eef2f7', borderRadius: 8, overflow: 'hidden', maxWidth: 480 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: over ? '#EF4444' : '#2563EB' }} />
                    </div>
                    <div className="helper">${fmtMoney(spent)} / ${fmtMoney(limit)}</div>
                  </div>
                );
              })}
            </div>
            {!budgets.length && <div className="helper">No budgets configured.</div>}
          </>
        )}
      </div>
    </div>
  );
}
