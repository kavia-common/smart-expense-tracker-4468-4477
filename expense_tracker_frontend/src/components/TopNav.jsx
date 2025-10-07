import React from 'react';

/**
 * PUBLIC_INTERFACE
 * TopNav - simplified (auth removed)
 */
export default function TopNav() {
  return (
    <div className="topnav" style={{ background: 'transparent', boxShadow: 'none' }}>
      <div className="title" style={{ fontWeight: 700 }}>Smart Expense Tracker</div>
      <div className="actions">{/* Auth removed; placeholder for future actions */}</div>
    </div>
  );
}
