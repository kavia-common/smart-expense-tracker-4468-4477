import React, { useMemo, useState } from 'react';
import useBudgets from '../hooks/useBudgets';
import useCategories from '../hooks/useCategories';

/**
 * PUBLIC_INTERFACE
 * Budgets - manage budgets with add/delete, validation, modal form, and consistent spacing.
 */
export default function Budgets() {
  const { data, loading, error, add, remove, isSubmitting } = useBudgets();

  // Expense categories for current demo user, include defaults
  const { data: categories, loading: catLoading, error: catError } = useCategories({
    type: 'expense',
    user_id: '11111111-1111-1111-1111-111111111111',
    include_defaults: true
  });

  const [isOpen, setIsOpen] = useState(false);
  const currentMonth = useMemo(() => new Date().toISOString().slice(0,7), []);
  const [form, setForm] = useState({
    category_id: '',
    month: currentMonth, // YYYY-MM
    period: 'monthly',
    limit_amount: ''
  });
  const [formError, setFormError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.category_id) return 'Category is required';
    if (!form.month || !/^\d{4}-\d{2}$/.test(form.month)) return 'Month must be YYYY-MM';
    if (!form.limit_amount || Number.isNaN(Number(form.limit_amount)) || Number(form.limit_amount) <= 0) return 'Valid positive limit required';
    if (form.period !== 'monthly') return 'Unsupported period';
    return '';
  };

  const resetForm = () => {
    setForm({ category_id: '', month: currentMonth, period: 'monthly', limit_amount: '' });
    setFormError('');
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) { setFormError(v); return; }
    setFormError('');
    const payload = {
      user_id: '11111111-1111-1111-1111-111111111111',
      category_id: form.category_id,
      month: form.month, // backend normalizes to YYYY-MM-01
      period: form.period,
      limit_amount: Number(form.limit_amount)
    };
    const res = await add(payload);
    if (res.ok) {
      setIsOpen(false);
      resetForm();
    } else {
      setFormError(res.error || 'Failed to create budget');
    }
  };

  const fmtMoney = (n) => {
    const v = Number(n || 0);
    return v.toFixed ? v.toFixed(2) : v;
    };

  const monthLabel = (m) => m;

  return (
    <div>
      <div className="page-header">
        <h2>Budgets</h2>
        <div className="gap-2" style={{ display: 'flex' }}>
          <button className="btn" onClick={() => setIsOpen(true)}>➕ Add Budget</button>
        </div>
      </div>

      <div className="card section">
        {loading && <div className="skeleton" style={{height: 16, width: '40%'}} />}
        {error && <div className="helper" style={{ color: 'var(--color-error)' }}>Failed to load budgets</div>}
        {!loading && !error && (
          <>
            <div className="list">
              {data.map(b => {
                const limit = Number(b.limit_amount ?? b.limit ?? 0);
                const spent = Number(b.spent ?? 0);
                const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
                const over = spent > limit;
                return (
                  <div
                    key={b.id}
                    className="gap-2"
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{b.categoryName || b.category || 'Category'}</div>
                      <div className="helper">{monthLabel((b.month || '').slice(0,7))}</div>
                      <div className="mt-2" style={{ height: 8, background: '#eef2f7', borderRadius: 8, overflow: 'hidden', maxWidth: 320 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: over ? '#EF4444' : '#2563EB' }} />
                      </div>
                    </div>
                    <div className="helper">${fmtMoney(spent)} / ${fmtMoney(limit)}</div>
                    <button className="btn btn-secondary" aria-label={`Delete budget ${b.id}`} onClick={() => remove(b.id)}>🗑️</button>
                  </div>
                );
              })}
            </div>
            {!data.length && <div className="helper">Create your first budget</div>}
          </>
        )}
      </div>

      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Add Budget">
          <div className="modal">
            <div className="modal-header">
              <h3 className="m-0">Add Budget</h3>
            </div>
            <div className="modal-body">
              {formError && <div className="helper" style={{ color: 'var(--color-error)' }}>{formError}</div>}

              <div className="form-row">
                <label htmlFor="category_id">Category</label>
                {catLoading && <div className="skeleton" style={{ height: 12, width: '60%' }} />}
                {!catLoading && catError && <div className="helper" style={{ color: 'var(--color-error)' }}>Failed to load categories</div>}
                {!catLoading && !catError && (
                  <select
                    id="category_id"
                    name="category_id"
                    className="input select"
                    value={form.category_id}
                    onChange={onChange}
                  >
                    <option value="">{categories.length ? 'Select category' : 'No categories available'}</option>
                    {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                )}
              </div>

              <div className="field-inline">
                <div className="form-row">
                  <label htmlFor="month">Month</label>
                  <input
                    id="month"
                    name="month"
                    type="month"
                    className="input"
                    value={form.month}
                    onChange={onChange}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="period">Period</label>
                  <select id="period" name="period" className="input select" value={form.period} onChange={onChange}>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="limit_amount">Limit</label>
                <input
                  id="limit_amount"
                  name="limit_amount"
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                  value={form.limit_amount}
                  onChange={onChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setIsOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</button>
              <button className="btn" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Budget'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
