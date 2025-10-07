import React from 'react';
import useBudgets from '../hooks/useBudgets';

/**
 * PUBLIC_INTERFACE
 * Budgets - list user budgets with basic progress info
 */
export default function Budgets() {
  const { data, loading, error } = useBudgets();

  return (
    <div>
      <div className="page-header">
        <h2>Budgets</h2>
      </div>
      <div className="card">
        {loading && <div className="skeleton" style={{height: 16, width: '40%'}} />}
        {error && <div className="helper">Failed to load budgets</div>}
        {!loading && !error && (
          <div className="list">
            {data.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{b.category}</span>
                <span>{b.spent}/{b.limit}</span>
              </div>
            ))}
            {!data.length && <div className="helper">Create your first budget</div>}
          </div>
        )}
      </div>
    </div>
  );
}
