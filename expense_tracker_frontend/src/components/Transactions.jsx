import React from 'react';
import useTransactions from '../hooks/useTransactions';

/**
 * PUBLIC_INTERFACE
 * Transactions - read-only list with loading/empty states using mock-enabled hook.
 */
export default function Transactions() {
  const { transactions, loading, error } = useTransactions();

  return (
    <div>
      <div className="page-header">
        <h2>Transactions</h2>
      </div>

      <div className="card">
        {loading && <div className="skeleton" style={{height: 16, width: '50%'}} />}
        {error && <div className="helper" style={{ color: 'var(--color-error)' }}>Failed to load transactions</div>}
        {!loading && !error && (
          <div className="list">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="gap-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}
              >
                <span className="helper">
                  {(tx.transaction_date || tx.date)} • {tx.category_name || tx.category || (tx.category_id ? 'Categorized' : 'Uncategorized')}
                </span>
                <strong>${Number(tx.amount).toFixed ? Number(tx.amount).toFixed(2) : tx.amount}</strong>
              </div>
            ))}
            {!transactions.length && <div className="helper">No transactions found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
