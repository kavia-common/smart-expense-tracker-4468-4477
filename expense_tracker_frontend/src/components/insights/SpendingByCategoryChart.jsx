import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * PUBLIC_INTERFACE
 * SpendingByCategoryChart - renders a doughnut chart for spending by category
 * Props:
 *  - data: [{ categoryName, total }]
 *  - loading: boolean
 *  - error: string
 *  - onRetry?: function
 */
export default function SpendingByCategoryChart({ data = [], loading = false, error = '', onRetry }) {
  const hasData = Array.isArray(data) && data.length > 0 && data.some(d => Number(d.total) > 0);
  const labels = data.map(d => d.categoryName);
  const values = data.map(d => Number(d.total));

  const colors = useMemo(() => {
    // Ocean professional palette variants
    const base = ['#2563EB', '#60A5FA', '#93C5FD', '#1D4ED8', '#3B82F6', '#0EA5E9', '#34D399', '#F59E0B', '#EF4444', '#6B7280'];
    return labels.map((_, i) => base[i % base.length]);
  }, [labels]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Spending',
        data: values,
        backgroundColor: colors,
        borderWidth: 0
      }
    ]
  };

  const options = {
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12 } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: $${ctx.raw}` } }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="card" style={{ minHeight: 320, display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Spending by Category</h3>
        {loading && <span className="helper">Loading...</span>}
        {!loading && error && <button className="btn btn-secondary" onClick={onRetry}>Retry</button>}
      </div>
      {loading && <div className="skeleton" style={{ height: 12, width: '60%' }} />}
      {!loading && error && <div className="helper" style={{ color: 'var(--color-error)' }}>{error}</div>}
      {!loading && !error && !hasData && <div className="helper">No spending data for this period.</div>}
      {!loading && !error && hasData && (
        <div style={{ position: 'relative' }}>
          <div style={{ height: 260 }}>
            <Doughnut data={chartData} options={options} />
          </div>
        </div>
      )}
    </div>
  );
}
