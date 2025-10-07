import React, { useMemo, useState } from 'react';
import useTransactions from '../hooks/useTransactions';

/**
 * PUBLIC_INTERFACE
 * Transactions - list of transactions with modal Add and row Delete, category selection, validation, and disabled states.
 */
export default function Transactions() {
  const { data, loading, error, add, remove, categories, isSubmitting } = useTransactions();
  const [isOpen, setIsOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0,10), []);
  const [form, setForm] = useState({
    date: today,
    amount: '',
    merchant: '',
    memo: '',
    account_id: '',
    category_id: '',
  });
  const [formError, setFormError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      date: today,
      amount: '',
      merchant: '',
      memo: '',
      account_id: '',
      category_id: '',
    });
    setFormError('');
  };

  const validate = () => {
    if (!form.date) return 'Date is required';
    if (!form.amount || Number.isNaN(Number(form.amount))) return 'Valid amount is required';
    if (!form.category_id) return 'Category is required';
    return '';
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }
    setFormError('');
    const payload = {
      user_id: '11111111-1111-1111-1111-111111111111',
      amount: Number(form.amount),
      direction: 'outflow',
      description: form.memo || form.merchant || 'Expense',
      transaction_date: form.date,
      account_id: form.account_id || null,
      category_id: form.category_id || null
    };
    const ok = await add(payload);
    if (ok) {
      setIsOpen(false);
      resetForm();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Transactions</h2>
        <div className="gap-2" style={{ display: 'flex' }}>
          <button className="btn" onClick={() => setIsOpen(true)}>➕ Add Expense</button>
        </div>
      </div>

      <div className="card">
        {loading && <div className="skeleton" style={{height: 16, width: '50%'}} />}
        {error && <div className="helper" style={{ color: 'var(--color-error)' }}>Failed to load transactions</div>}
        {!loading && !error && (
          <div className="list">
            {data.map(tx => (
              <div
                key={tx.id}
                className="gap-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center' }}
              >
                <span className="helper">
                  {(tx.transaction_date || tx.date)} • {tx.category_name || tx.category || (tx.category_id ? 'Categorized' : 'Uncategorized')}
                </span>
                <strong>${Number(tx.amount).toFixed ? Number(tx.amount).toFixed(2) : tx.amount}</strong>
                <button className="btn btn-secondary" onClick={() => remove(tx.id)} aria-label={`Delete ${tx.id}`}>🗑️</button>
              </div>
            ))}
            {!data.length && <div className="helper">No transactions found</div>}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Add Expense">
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Add Expense</h3>
            </div>
            <div className="modal-body">
              {formError && <div className="helper" style={{ color: 'var(--color-error)' }}>{formError}</div>}
              <div className="field-inline">
                <div className="form-row">
                  <label htmlFor="date">Date</label>
                  <input id="date" name="date" type="date" className="input" value={form.date} onChange={onChange} />
                </div>
                <div className="form-row">
                  <label htmlFor="amount">Amount</label>
                  <input id="amount" name="amount" type="number" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={onChange} />
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="merchant">Merchant</label>
                <input id="merchant" name="merchant" className="input" placeholder="e.g., Coffee Shop" value={form.merchant} onChange={onChange} />
              </div>

              <div className="form-row">
                <label htmlFor="memo">Memo</label>
                <input id="memo" name="memo" className="input" placeholder="Optional note" value={form.memo} onChange={onChange} />
              </div>

              <div className="field-inline">
                <div className="form-row">
                  <label htmlFor="category_id">Category</label>
                  <select id="category_id" name="category_id" className="input select" value={form.category_id} onChange={onChange}>
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label htmlFor="account_id">Account</label>
                  <select id="account_id" name="account_id" className="input select" value={form.account_id} onChange={onChange}>
                    <option value="">Unspecified</option>
                    <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1">Everyday Checking</option>
                    <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2">High-Yield Savings</option>
                    <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3">Rewards Credit</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setIsOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</button>
              <button className="btn" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Expense'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
