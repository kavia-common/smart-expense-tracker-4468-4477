import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost, isApiEnabled, setAuthToken } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

/**
 * Registration form to create a new user and optionally auto-login.
 */
export default function Register() {
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setOk('');
    setLoading(true);
    try {
      if (!isApiEnabled()) {
        // Mock mode
        setOk('Registered in mock mode. You can now sign in.');
        return;
      }
      await apiPost('/auth/register', form);
      // After successful registration, attempt login for convenience
      const { data } = await apiPost('/auth/login', { email: form.email, password: form.password });
      const token = data?.token || data?.accessToken || data?.jwt;
      if (token) {
        setAuthToken(token);
        setUserFromToken(data?.user || { name: form.name, email: form.email });
        navigate('/');
      } else {
        setOk('Registration successful. Please log in.');
        navigate('/login');
      }
    } catch (error) {
      setErr(error?.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking smarter today</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Name
            <input
              className="auth-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
          {err && <div className="auth-error">{err}</div>}
          {ok && <div className="auth-success">{ok}</div>}
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          <span>Already have an account?</span>{' '}
          <Link className="link" to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
