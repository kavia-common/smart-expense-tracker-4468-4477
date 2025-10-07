import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * TopNav - shows quick actions and user menu
 */
export default function TopNav() {
  const { isAuthenticated, user, logout } = useAuth();
  const initials = useMemo(() => {
    const name = user?.name || user?.email || 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }, [user]);

  return (
    <div className="topnav" style={{ background: 'transparent', boxShadow: 'none' }}>
      <div className="title" style={{ fontWeight: 700 }}>Smart Expense Tracker</div>
      <div className="actions">
        {isAuthenticated ? (
          <div className="user-menu">
            <span className="avatar">{initials}</span>
            <div className="dropdown">
              <Link className="dropdown-item" to="/profile">Profile</Link>
              <button className="dropdown-item" onClick={logout}>Logout</button>
            </div>
          </div>
        ) : (
          <div className="auth-links" style={{ display: 'flex', gap: 12 }}>
            <Link className="link" to="/login">Login</Link>
            <Link className="link" to="/register">Register</Link>
          </div>
        )}
      </div>
    </div>
  );
}
