import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Sidebar - left navigation with links to main routes
 */
export default function Sidebar() {
  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <NavLink className={linkClass} to="/dashboard">🏠 Dashboard</NavLink>
      <NavLink className={linkClass} to="/transactions">💳 Transactions</NavLink>
      <NavLink className={linkClass} to="/budgets">📊 Budgets</NavLink>
      <NavLink className={linkClass} to="/goals">🎯 Goals</NavLink>
      <NavLink className={linkClass} to="/reports">📈 Reports</NavLink>
      <NavLink className={linkClass} to="/settings">⚙️ Settings</NavLink>
    </div>
  );
}
