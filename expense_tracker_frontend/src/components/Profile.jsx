import React, { useEffect, useState } from 'react';
import { apiGet, apiPut, isApiEnabled } from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Profile management: load and update user name and notification preferences.
 */
export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', notificationPreferences: { email: true, push: false } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setErr('');
      try {
        if (!isApiEnabled()) {
          setForm((f) => ({ ...f, name: user?.name || 'Mock User' }));
          return;
        }
        const { data } = await apiGet('/profile', { signal: controller.signal });
        if (!abort && data) {
          setForm({
            name: data.name || '',
            notificationPreferences: data.notificationPreferences || { email: true, push: false },
          });
        }
      } catch (e) {
        if (!abort) setErr('Failed to load profile.');
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => {
      abort = true;
      controller.abort();
    };
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePrefChange = (e) => {
    const { name, checked } = e.target;
    setForm((f) => ({ ...f, notificationPreferences: { ...f.notificationPreferences, [name]: checked } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      if (!isApiEnabled()) {
        setMsg('Saved (mock).');
        return;
      }
      await apiPut('/profile', form);
      setMsg('Profile updated.');
    } catch {
      setErr('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card p-4">Loading profile...</div>;

  return (
    <div className="card p-6">
      <h2 className="card-title">Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <label className="form-label">
          Name
          <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
        </label>
        <fieldset className="form-fieldset">
          <legend className="form-legend">Notifications</legend>
          <label className="checkbox">
            <input
              type="checkbox"
              name="email"
              checked={!!form.notificationPreferences.email}
              onChange={handlePrefChange}
            />
            Email alerts
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              name="push"
              checked={!!form.notificationPreferences.push}
              onChange={handlePrefChange}
            />
            Push notifications
          </label>
        </fieldset>
        {err && <div className="auth-error">{err}</div>}
        {msg && <div className="auth-success">{msg}</div>}
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
