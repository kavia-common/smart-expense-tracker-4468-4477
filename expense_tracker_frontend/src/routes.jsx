import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import Goals from './components/Goals';
import Reports from './components/Reports';
import Settings from './components/Settings';

// PUBLIC_INTERFACE
export default function RoutesView() {
  /** Render application routes with a Suspense fallback skeleton */
  return (
    <Suspense fallback={<div className="card"><div className="skeleton" style={{height: 20, width: 180}} /></div>}>
      <Routes>
        <Route path="/" element={<Navigate replace to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<div className="card">Not found</div>} />
      </Routes>
    </Suspense>
  );
}
