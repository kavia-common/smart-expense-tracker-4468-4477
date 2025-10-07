import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * TopNav - quick actions area on the top bar
 */
export default function TopNav() {
  const navigate = useNavigate();
  return (
    <div className="gap-2" style={{ display: 'flex' }}>
      <button className="btn" onClick={() => navigate('/transactions')}>➕ Add Expense</button>
      <button className="btn btn-secondary" onClick={() => navigate('/reports')}>View Reports</button>
    </div>
  );
}
