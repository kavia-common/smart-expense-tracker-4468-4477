import React, { useState } from 'react';
import useTransactions from '../hooks/useTransactions';

/**
 * PUBLIC_INTERFACE
 * Transactions - list of transactions and quick add placeholder
 */
export default function Transactions() {
  const { data, loading, error, add } = useTransactions();
  const [amount, setAmount] = useState('');

  return (
    <div>
      <div className="page-header">
        <h2>Transactions</h2>
        <div>
          <input className="input" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className="btn" onClick={() => { if (amount) { add({ amount: Number(amount), category: 'Misc', date: new Date().toISOString().slice(0,10) }); setAmount(''); }}}>Add</button>
        </div>
      </div>
      <div className="card">
        {loading && <div className="skeleton" style={{height: 16, width: '50%'}} />}
        {error && <div className="helper">Failed to load transactions</div>}
        {!loading && !error && (
          <div className="list">
            {data.map(tx => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{tx.date} • {tx.category}</span>
                <strong>${tx.amount}</strong>
              </div>
            ))}
            {!data.length && <div className="helper">No transactions found</div>}
          </div>
        )}
      </div>
    </div>
  );
}
