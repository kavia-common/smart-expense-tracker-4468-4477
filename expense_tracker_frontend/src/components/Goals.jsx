import React from 'react';
import useGoals from '../hooks/useGoals';

/**
 * PUBLIC_INTERFACE
 * Goals - progress overview with inline bars, loading/empty states.
 */
export default function Goals() {
  const { goals, loading, error } = useGoals();

  const fmtMoney = (n) => {
    const v = Number(n || 0);
    return v.toFixed ? v.toFixed(2) : v;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Goals</h2>
      </div>

      <div className="card">
        <div className="section-header">
          <h3 className="m-0">Savings Progress</h3>
          {loading && <span className="helper">Loading…</span>}
        </div>
        {loading && <div className="skeleton" style={{height: 16, width: '40%'}} />}
        {error && <div className="helper" style={{ color: 'var(--color-error)' }}>Failed to load goals</div>}
        {!loading && !error && (
          <>
            <div className="list">
              {goals.map(g => {
                const target = Number(g.target_amount ?? g.target ?? 0);
                const current = Number(g.current_amount ?? g.progress ?? 0);
                const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                return (
                  <div key={g.id}>
                    <div style={{ fontWeight: 700 }}>{g.name}</div>
                    <div className="helper">{g.target_date ? `Target by ${g.target_date}` : 'No target date'}</div>
                    <div className="mt-2" style={{ height: 8, background: '#eef2f7', borderRadius: 8, overflow: 'hidden', maxWidth: 480 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#34D399' }} />
                    </div>
                    <div className="helper">${fmtMoney(current)} / ${fmtMoney(target)}</div>
                  </div>
                );
              })}
            </div>
            {!goals.length && <div className="helper">Create your first goal</div>}
          </>
        )}
      </div>
    </div>
  );
}
