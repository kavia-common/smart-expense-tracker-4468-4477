import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './App.css';
import RoutesView from './routes';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';

/**
 * PUBLIC_INTERFACE
 * App - Main application component that sets up theme and layout
 * - Wraps the app in BrowserRouter and renders Sidebar, TopNav, and route content
 */
function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <BrowserRouter>
      <div className="App layout">
        <aside className="sidebar">
          <div className="sidebar-inner">
            <div className="sidebar-brand">💠 OceanTrack</div>
            <nav className="sidebar-nav">
              <Sidebar />
            </nav>
            <div className="sidebar-footer">v0.1 • Professional</div>
          </div>
        </aside>

        <header className="topnav">
          <div className="topnav-inner">
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge">Secure</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <TopNav />
            </div>
          </div>
        </header>

        <main className="main">
          <RoutesView />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
