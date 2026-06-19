import { useState } from 'react';
import SessionsView from './components/SessionsView.jsx';
import HeatmapView from './components/HeatmapView.jsx';

const VIEWS = [
  { id: 'sessions', label: 'Sessions', icon: '👥' },
  { id: 'heatmap', label: 'Heatmap', icon: '🔥' },
];

export default function App() {
  const [activeView, setActiveView] = useState('sessions');

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <div>
            <div className="sidebar-logo-text">CausalFunnel</div>
            <div className="sidebar-logo-sub">Analytics Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {VIEWS.map(v => (
            <button
              key={v.id}
              id={`nav-${v.id}`}
              className={`sidebar-nav-item ${activeView === v.id ? 'active' : ''}`}
              onClick={() => setActiveView(v.id)}
            >
              <span className="icon">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>CausalFunnel Assignment</p>
          <p style={{ marginTop: 4 }}>v1.0.0 · Node + React</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-title">
            {VIEWS.find(v => v.id === activeView)?.icon}{' '}
            {VIEWS.find(v => v.id === activeView)?.label}
          </div>
          <div className="topbar-actions">
            <div className="status-pill">
              <div className="status-dot" />
              Live
            </div>
            <a
              href="http://localhost:5173/../demo/index.html"
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                color: 'var(--text2)', padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                textDecoration: 'none', fontWeight: 500, display: 'flex',
                alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s',
              }}
              id="open-demo-btn"
            >
              🔗 Open Demo Page
            </a>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-content">
          {activeView === 'sessions' && <SessionsView key="sessions" />}
          {activeView === 'heatmap' && <HeatmapView key="heatmap" />}
        </div>
      </main>
    </div>
  );
}
