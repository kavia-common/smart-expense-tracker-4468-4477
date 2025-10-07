import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost, isApiEnabled, setAuthToken } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

/**
 * Login form that authenticates a user and stores a JWT token.
 */
export default function Login() {
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      if (!isApiEnabled()) {
        // Mock mode: accept any credentials
        setAuthToken('mock-token');
        setUserFromToken({ email: form.email });
        navigate('/');
        return;
      }
      const { data } = await apiPost('/auth/login', form);
      const token = data?.token || data?.accessToken || data?.jwt;
      if (!token) throw new Error('Missing token in response');
      setAuthToken(token);
      // Optionally decode user basics if available from payload/response
      setUserFromToken(data?.user || { email: form.email });
      navigate('/');
    } catch (error) {
      setErr(error?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="auth-form">
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
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <span>Don&apos;t have an account?</span>{' '}
          <Link className="link" to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
