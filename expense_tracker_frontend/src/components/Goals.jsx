import React from 'react';
import useGoals from '../hooks/useGoals';

/**
 * PUBLIC_INTERFACE
 * Goals - show savings goals and progress
 */
export default function Goals() {
  const { data, loading, error } = useGoals();

  return (
    <div>
      <div className="page-header">
        <h2>Goals</h2>
      </div>
      <div className="card">
        {loading && <div className="skeleton" style={{height: 16, width: '40%'}} />}
        {error && <div className="helper">Failed to load goals</div>}
        {!loading && !error && (
          <div className="list">
            {data.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{g.name}</span>
                <span>${g.progress}/${g.target}</span>
              </div>
            ))}
            {!data.length && <div className="helper">No goals defined</div>}
          </div>
        )}
      </div>
    </div>
  );
}
