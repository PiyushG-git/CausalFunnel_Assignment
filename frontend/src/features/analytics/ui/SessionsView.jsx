/**
 * analytics/ui/SessionsView.jsx
 * ──────────────────────────────
 * Pure UI — uses hooks for all data fetching, renders list of sessions
 * and detailed journey view based on the reference design.
 */

import { useState, useEffect } from 'react';
import { useSessions, useSessionEvents } from '../hooks/useSessions';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SessionRow({ session, isSelected, onClick }) {
  // Extracting details from session for the clean list look
  const shortId = session.session_id.slice(-5);
  const time = session.first_seen ? formatTime(session.first_seen) : '--:--:--';
  
  return (
    <div
      className={`session-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div>
        <div className="session-id">Session #{shortId}</div>
        <div className="session-events-badge">{session.total_events} Events</div>
      </div>
      <div className="session-meta">
        Direct • {time} • United Kingdom
      </div>
    </div>
  );
}

function EventTimeline({ sessionId }) {
  const { events, loading, error } = useSessionEvents(sessionId);
  const shortId = sessionId ? sessionId.slice(-5) : '';

  if (!sessionId) {
    return (
      <div className="details-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-title" style={{ fontWeight: 400 }}>Select a session to view its journey</div>
      </div>
    );
  }

  return (
    <div className="details-panel fade-in">
      <div className="details-header">
        <div>
          <div className="details-pretitle">Details</div>
          <div className="details-title">JOURNEY: #{shortId}</div>
        </div>
        <div className="details-user">
          USER ID: UX_{shortId.slice(-3)}
        </div>
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /></div>}
      {error && <div style={{ color: 'var(--red)', padding: '1rem' }}>Error: {error}</div>}

      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">No events found</div>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="timeline">
          {events.map((evt, i) => {
            const isPageView = evt.event_type === 'page_view';
            const title = isPageView ? 'Page View' : `Click: "${evt.x}, ${evt.y}"`; // using coords as proxy for what they clicked
            const sub = isPageView ? new URL(evt.page_url).pathname : 'btn_interaction';

            return (
              <div key={evt._id || i} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-time">{formatTime(evt.timestamp)}</div>
                  <div className="timeline-title">{title}</div>
                  <div className="timeline-sub">{sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SessionsView() {
  const { sessions, loading, error } = useSessions();
  const [selectedSession, setSelectedSession] = useState(null);

  const totalEvents = sessions.reduce((a, s) => a + s.total_events, 0);
  const pageViews = sessions.reduce((a, s) => a + s.page_view_count, 0);

  // Auto-select first session when loaded
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0].session_id);
    }
  }, [sessions, selectedSession]);

  return (
    <div className="fade-in">
      <div className="page-subtitle">Real-Time Performance</div>
      <h1 className="page-title">SESSION ANALYTICS DASHBOARD</h1>

      {/* Stat Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{sessions.length.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{totalEvents.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Page Views</div>
          <div className="stat-value">{pageViews.toLocaleString()}</div>
        </div>
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /></div>}
      {error && <div style={{ color: 'var(--red)' }}>Error: {error}</div>}

      {!loading && !error && sessions.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">No sessions tracked yet</div>
          <p>Open the demo page to generate tracking data.</p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="split-view">
          {/* Left Column: Recent Sessions */}
          <div>
            <h2 className="section-heading">Recent Sessions</h2>
            <div className="session-list">
              {sessions.slice(0, 15).map((s) => (
                <SessionRow
                  key={s.session_id}
                  session={s}
                  isSelected={selectedSession === s.session_id}
                  onClick={() => setSelectedSession(s.session_id)}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Journey Details */}
          <div>
            <EventTimeline sessionId={selectedSession} />
          </div>
        </div>
      )}
    </div>
  );
}
