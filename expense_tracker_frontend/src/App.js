import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import './App.css';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import AppRoutes from './routes';

function HealthBadge() {
  const [status, setStatus] = useState('checking');
  const apiUrl = process.env.REACT_APP_API_URL;
  const isMock = String(process.env.REACT_APP_USE_MOCK ?? '1') === '1';

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    async function check() {
      if (isMock || !apiUrl) {
        setStatus('mock');
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/health`, { signal: controller.signal });
        if (!abort) setStatus(res.ok ? 'ok' : 'down');
      } catch {
        if (!abort) setStatus('down');
      }
    }
    check();
    return () => {
      abort = true;
      controller.abort();
    };
  }, [apiUrl, isMock]);

  const label =
    status === 'mock' ? 'Mock mode' : status === 'ok' ? 'API OK' : status === 'down' ? 'API Down' : 'Checking';

  const dotColor =
    status === 'ok' ? '#10b981' : status === 'down' ? '#ef4444' : status === 'mock' ? '#f59e0b' : '#6b7280';

  return (
    <div className="health-badge" title={apiUrl ? apiUrl : 'Mock mode'}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, display: 'inline-block' }} />
      <span style={{ fontSize: 12 }}>{label}</span>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * App - Main application component (auth disabled)
 */
function App() {
  return (
    <div className="App">
      <Router>
        <div className="topnav">
          <TopNav />
        </div>
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
          <aside className="sidebar">
            <Sidebar />
          </aside>
          <main style={{ flex: 1, padding: 16, display: 'grid', gap: 12 }}>
            <HealthBadge />
            <AppRoutes />
          </main>
        </div>
      </Router>
    </div>
  );
}

export default App;
