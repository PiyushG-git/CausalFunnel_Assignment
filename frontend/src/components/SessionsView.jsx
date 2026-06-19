import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

function formatDuration(first, last) {
  const diff = new Date(last) - new Date(first);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function SessionRow({ session, isSelected, onClick }) {
  return (
    <tr
      className={isSelected ? 'selected' : ''}
      onClick={onClick}
      id={`session-row-${session.session_id.slice(-8)}`}
    >
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <code style={{ fontSize: '0.78rem', color: 'var(--accent-light)' }}>
            {session.session_id}
          </code>
          <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
            {formatTime(session.first_seen)}
          </span>
        </div>
      </td>
      <td>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{session.total_events}</span>
      </td>
      <td>
        <span className="badge green">👁 {session.page_view_count}</span>
      </td>
      <td>
        <span className="badge orange">🖱 {session.click_count}</span>
      </td>
      <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>
        {session.first_seen && session.last_seen
          ? formatDuration(session.first_seen, session.last_seen)
          : '—'}
      </td>
      <td style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
        {session.pages_visited}
      </td>
      <td>
        <span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>›</span>
      </td>
    </tr>
  );
}

function EventTimeline({ sessionId, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getSessionEvents(sessionId)
      .then(data => setEvents(data.events || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="journey-panel">
      <div className="journey-header">
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Event Journey</div>
          <div className="journey-session-id">{sessionId}</div>
        </div>
        <button className="close-btn" onClick={onClose} id="close-journey-btn">✕</button>
      </div>

      {loading && (
        <div className="loading-wrap"><div className="spinner" /></div>
      )}

      {error && (
        <div style={{ color: 'var(--red)', padding: '1rem', fontSize: '0.875rem' }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No events found</div>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="timeline">
          {events.map((evt, i) => (
            <div key={evt._id || i} className="timeline-item" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className={`timeline-dot ${evt.event_type}`}>
                {evt.event_type === 'page_view' ? '👁' : '🖱'}
              </div>
              <div className="timeline-content">
                <div className={`timeline-type ${evt.event_type}`}>
                  {evt.event_type === 'page_view' ? 'Page View' : 'Click'}
                </div>
                <div className="timeline-url">{evt.page_url}</div>
                <div className="timeline-meta">
                  <span>🕐 {formatTime(evt.timestamp)}</span>
                  {evt.event_type === 'click' && evt.x !== null && (
                    <span>📍 ({evt.x}, {evt.y})</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SessionsView() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.getSessions()
      .then(data => setSessions(data.sessions || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalEvents = sessions.reduce((a, s) => a + s.total_events, 0);
  const totalClicks = sessions.reduce((a, s) => a + s.click_count, 0);

  return (
    <div className="fade-in">
      {/* Stat Cards */}
      <div className="stats-row">
        <div className="stat-card accent">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-sub">unique visitors</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{totalEvents}</div>
          <div className="stat-sub">tracked interactions</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Total Clicks</div>
          <div className="stat-value">{totalClicks}</div>
          <div className="stat-sub">click events</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Avg Events</div>
          <div className="stat-value">
            {sessions.length ? (totalEvents / sessions.length).toFixed(1) : '0'}
          </div>
          <div className="stat-sub">per session</div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="section-header">
        <div>
          <div className="section-title">All Sessions</div>
          <div className="section-sub">Click a row to view the user's event journey</div>
        </div>
        <button className="refresh-btn" onClick={load} id="refresh-sessions-btn">
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="loading-wrap"><div className="spinner" /></div>
      )}

      {error && (
        <div style={{ color: 'var(--red)', padding: '1rem' }}>Error: {error}</div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="table-wrap">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No sessions yet</div>
            <div className="empty-sub">Open the demo page and interact to generate tracking data</div>
          </div>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedSession ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div className="table-wrap">
            <table id="sessions-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Events</th>
                  <th>Page Views</th>
                  <th>Clicks</th>
                  <th>Duration</th>
                  <th>Pages</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <SessionRow
                    key={s.session_id}
                    session={s}
                    isSelected={selectedSession === s.session_id}
                    onClick={() => setSelectedSession(
                      selectedSession === s.session_id ? null : s.session_id
                    )}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {selectedSession && (
            <EventTimeline
              sessionId={selectedSession}
              onClose={() => setSelectedSession(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
