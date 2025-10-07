import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from 'chart.js';
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

/**
 * PUBLIC_INTERFACE
 * IncomeVsExpenseChart - line chart for income vs expense and net over time
 * Props:
 *  - data: [{ period: 'YYYY-MM', income, expense, net }]
 *  - loading: boolean
 *  - error: string
 *  - onRetry?: function
 */
export default function IncomeVsExpenseChart({ data = [], loading = false, error = '', onRetry }) {
  const labels = data.map(d => d.period);
  const incomes = data.map(d => Number(d.income));
  const expenses = data.map(d => Number(d.expense));
  const net = data.map(d => Number(d.net));
  const hasData = data.length > 0 && (incomes.some(v => v) || expenses.some(v => v));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomes,
        borderColor: '#34D399',
        backgroundColor: 'rgba(52, 211, 153, .2)',
        tension: 0.35
      },
      {
        label: 'Expense',
        data: expenses,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, .15)',
        tension: 0.35
      },
      {
        label: 'Net',
        data: net,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, .15)',
        tension: 0.35
      }
    ]
  };

  const options = {
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: $${ctx.raw}`
        }
      }
    },
    scales: {
      y: { beginAtZero: true }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="card" style={{ minHeight: 320, display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <div className="section-header">
        <h3 className="m-0">Income vs Expense (3 months)</h3>
        <div>
          {loading && <span className="helper">Loading...</span>}
          {!loading && error && <button className="btn btn-secondary" onClick={onRetry}>Retry</button>}
        </div>
      </div>
      {loading && <div className="skeleton" style={{ height: 12, width: '60%' }} />}
      {!loading && error && <div className="helper" style={{ color: 'var(--color-error)' }}>{error}</div>}
      {!loading && !error && !hasData && <div className="helper">No trend data to display.</div>}
      {!loading && !error && hasData && (
        <div style={{ height: 260 }}>
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}
