import { useState } from 'react';
import SessionsView from './features/analytics/ui/SessionsView.jsx';
import HeatmapView from './features/analytics/ui/HeatmapView.jsx';

const VIEWS = [
  { id: 'sessions', label: 'SESSIONS' },
  { id: 'heatmap', label: 'HEATMAPS' },
  { id: 'settings', label: 'SETTINGS' },
];

export default function App() {
  const [activeView, setActiveView] = useState('sessions');

  return (
    <div className="layout">
      {/* ── Top Bar ── */}
      <nav className="topbar">
        <div className="topbar-logo">SESS_TRK</div>
        <div className="topbar-nav">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={`topbar-nav-item ${activeView === v.id ? 'active' : ''}`}
              onClick={() => setActiveView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main">
        {activeView === 'sessions' && <SessionsView key="sessions" />}
        {activeView === 'heatmap' && <HeatmapView key="heatmap" />}
        {activeView === 'settings' && (
          <div className="empty-state">
            <div className="empty-title">Settings Configuration</div>
            <div>Nothing to configure at the moment.</div>
          </div>
        )}
      </main>
    </div>
  );
}
