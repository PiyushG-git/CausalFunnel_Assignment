/**
 * analytics/hooks/useSessions.js
 * ──────────────────────────────
 * Encapsulates all sessions data-fetching logic.
 * UI components stay dumb — they just call this hook and render.
 */

import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../service/api';

/**
 * Hook to fetch and manage all sessions.
 * Auto-refreshes every 30 seconds so the dashboard stays live.
 * @returns {{ sessions, loading, error, refetch }}
 */
export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    analyticsApi
      .getSessions()
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-refresh every 30 seconds — keeps dashboard live as demo generates events
  useEffect(() => {
    const timer = setInterval(refetch, 30_000);
    return () => clearInterval(timer);
  }, [refetch]);

  return { sessions, loading, error, refetch };
}


/**
 * Hook to fetch all events for a single session (event journey).
 * @param {string|null} sessionId
 * @returns {{ events, loading, error }}
 */
export function useSessionEvents(sessionId) {
  const [events, setEvents]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setEvents([]);
      return;
    }

    // AbortController cancels the in-flight request if sessionId changes
    // or the component unmounts — prevents setState on unmounted component
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    analyticsApi
      .getSessionEvents(sessionId, controller.signal)
      .then((data) => setEvents(data.events || []))
      .catch((err) => {
        // Ignore abort errors — they're intentional cancellations
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    // Cleanup: abort if sessionId changes before fetch resolves
    return () => controller.abort();
  }, [sessionId]);

  return { events, loading, error };
}

