import React, { useMemo, useState } from 'react';
import useGoals from '../hooks/useGoals';

/**
 * PUBLIC_INTERFACE
 * Goals - manage savings goals with add/delete, validation, modal form, optimistic updates, and standardized spacing.
 */
export default function Goals() {
  const { data, loading, error, add, remove, isSubmitting } = useGoals();

  const today = useMemo(() => new Date().toISOString().slice(0,10), []);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: today
  });
  const [formError, setFormError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.name || form.name.trim().length === 0) return 'Name is required';
    const t = Number(form.target_amount);
    if (!form.target_amount || Number.isNaN(t) || t <= 0) return 'Valid positive target amount required';
    if (form.current_amount !== '' && (Number.isNaN(Number(form.current_amount)) || Number(form.current_amount) < 0)) {
      return 'Current amount must be a non-negative number';
    }
    if (form.target_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.target_date)) return 'Target date must be YYYY-MM-DD';
    return '';
  };

  const resetForm = () => {
    setForm({ name: '', target_amount: '', current_amount: '', target_date: today });
    setFormError('');
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) { setFormError(v); return; }
    setFormError('');
    const payload = {
      user_id: '11111111-1111-1111-1111-111111111111',
      name: form.name.trim(),
      target_amount: Number(form.target_amount),
      current_amount: form.current_amount === '' ? 0 : Number(form.current_amount),
      target_date: form.target_date || null
    };
    const res = await add(payload);
    if (res.ok) {
      setIsOpen(false);
      resetForm();
    } else {
      setFormError(res.error || 'Failed to create goal');
    }
  };

  const fmtMoney = (n) => {
    const v = Number(n || 0);
    return v.toFixed ? v.toFixed(2) : v;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Goals</h2>
        <div className="gap-2" style={{ display: 'flex' }}>
          <button className="btn" onClick={() => setIsOpen(true)}>➕ Add Goal</button>
        </div>
      </div>

      <div className="card section">
        {loading && <div className="skeleton" style={{height: 16, width: '40%'}} />}
        {error && <div className="helper" style={{ color: 'var(--color-error)' }}>Failed to load goals</div>}
        {!loading && !error && (
          <>
            <div className="list">
              {data.map(g => {
                const target = Number(g.target_amount ?? g.target ?? 0);
                const current = Number(g.current_amount ?? g.progress ?? 0);
                const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                return (
                  <div
                    key={g.id}
                    className="gap-2"
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{g.name}</div>
                      <div className="helper">{g.target_date ? `Target by ${g.target_date}` : 'No target date'}</div>
                      <div className="mt-2" style={{ height: 8, background: '#eef2f7', borderRadius: 8, overflow: 'hidden', maxWidth: 320 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#34D399' }} />
                      </div>
                    </div>
                    <div className="helper">${fmtMoney(current)} / ${fmtMoney(target)}</div>
                    <button className="btn btn-secondary" aria-label={`Delete goal ${g.id}`} onClick={() => remove(g.id)}>🗑️</button>
                  </div>
                );
              })}
            </div>
            {!data.length && <div className="helper">Create your first goal</div>}
          </>
        )}
      </div>

      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Add Goal">
          <div className="modal">
            <div className="modal-header">
              <h3 className="m-0">Add Goal</h3>
            </div>
            <div className="modal-body">
              {formError && <div className="helper" style={{ color: 'var(--color-error)' }}>{formError}</div>}

              <div className="form-row">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" className="input" value={form.name} onChange={onChange} placeholder="e.g., Emergency Fund" />
              </div>

              <div className="field-inline">
                <div className="form-row">
                  <label htmlFor="target_amount">Target Amount</label>
                  <input id="target_amount" name="target_amount" type="number" step="0.01" className="input" placeholder="0.00" value={form.target_amount} onChange={onChange} />
                </div>
                <div className="form-row">
                  <label htmlFor="current_amount">Current Amount</label>
                  <input id="current_amount" name="current_amount" type="number" step="0.01" className="input" placeholder="0.00" value={form.current_amount} onChange={onChange} />
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="target_date">Target Date</label>
                <input id="target_date" name="target_date" type="date" className="input" value={form.target_date} onChange={onChange} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setIsOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</button>
              <button className="btn" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Goal'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
