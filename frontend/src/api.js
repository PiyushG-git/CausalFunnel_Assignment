const BASE = '/api';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /** List all sessions with summary stats */
  getSessions: () => request('/sessions'),

  /** Get ordered event journey for a session */
  getSessionEvents: (sessionId) => request(`/sessions/${encodeURIComponent(sessionId)}/events`),

  /** Get click heatmap data for a page URL */
  getHeatmap: (pageUrl) => request(`/heatmap?page_url=${encodeURIComponent(pageUrl)}`),

  /** List all pages that have click data */
  getHeatmapPages: () => request('/heatmap/pages'),
};
