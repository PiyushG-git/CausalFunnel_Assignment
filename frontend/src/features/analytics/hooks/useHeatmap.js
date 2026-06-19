/**
 * analytics/hooks/useHeatmap.js
 * ──────────────────────────────
 * Encapsulates all heatmap data-fetching logic.
 */

import { useState, useEffect } from 'react';
import { analyticsApi } from '../service/api';

/**
 * Hook to fetch all page URLs that have click data.
 * @returns {{ pages, loading, error }}
 */
export function useHeatmapPages() {
  const [pages, setPages]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]    = useState(null);

  useEffect(() => {
    analyticsApi
      .getHeatmapPages()
      .then((data) => setPages(data.pages || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { pages, loading, error };
}

/**
 * Hook to fetch click coordinates for a specific page URL.
 * Re-fetches automatically when selectedPage changes.
 * @param {string} selectedPage
 * @returns {{ clicks, loading, error }}
 */
export function useHeatmap(selectedPage) {
  const [clicks, setClicks]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState(null);

  useEffect(() => {
    if (!selectedPage) {
      setClicks([]);
      return;
    }
    setLoading(true);
    setError(null);
    analyticsApi
      .getHeatmap(selectedPage)
      .then((data) => setClicks(data.clicks || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedPage]);

  return { clicks, loading, error };
}
