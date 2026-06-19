/**
 * analytics/service/api.js
 * ─────────────────────────
 * All HTTP calls for the analytics feature.
 * Components and hooks never call fetch() directly — they use this layer.
 */

const BASE = '/api';

async function request(path, signal) {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const analyticsApi = {
  /** List all sessions with summary stats */
  getSessions: () => request('/sessions'),

  /** Get ordered event journey for a session (supports AbortSignal) */
  getSessionEvents: (sessionId, signal) =>
    request(`/sessions/${encodeURIComponent(sessionId)}/events`, signal),

  /** Get click heatmap data for a specific page URL */
  getHeatmap: (pageUrl) =>
    request(`/heatmap?page_url=${encodeURIComponent(pageUrl)}`),

  /** List all pages that have click data */
  getHeatmapPages: () => request('/heatmap/pages'),
};

