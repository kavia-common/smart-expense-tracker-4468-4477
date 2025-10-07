import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Sidebar - left navigation with active state styling
 */
export default function Sidebar() {
  const activeClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <NavLink to="/dashboard" end className={activeClass}>🏠 Dashboard</NavLink>
      <NavLink to="/transactions" className={activeClass}>💳 Transactions</NavLink>
      <NavLink to="/budgets" className={activeClass}>📊 Budgets</NavLink>
      <NavLink to="/goals" className={activeClass}>🎯 Goals</NavLink>
      <NavLink to="/reports" className={activeClass}>📈 Reports</NavLink>
      <NavLink to="/settings" className={activeClass}>⚙️ Settings</NavLink>
      <NavLink to="/profile" className={activeClass}>👤 Profile</NavLink>
    </div>
  );
}
