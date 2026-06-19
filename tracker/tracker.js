/**
 * CausalFunnel Tracker v1.0
 * ─────────────────────────
 * Embeddable analytics tracking script.
 * Tracks: page_view, click events.
 *
 * Usage:
 *   <script src="tracker.js" data-endpoint="http://localhost:5000/api/events"></script>
 *
 * Or configure programmatically:
 *   window.CF_TRACKER_ENDPOINT = 'http://localhost:5000/api/events';
 */

(function () {
  'use strict';

  // ─── Configuration ──────────────────────────────────────────────────────────
  const scriptTag = document.currentScript;
  const ENDPOINT =
    (scriptTag && scriptTag.getAttribute('data-endpoint')) ||
    window.CF_TRACKER_ENDPOINT ||
    'http://localhost:5000/api/events';

  const SESSION_KEY = 'cf_session_id';
  const BATCH_INTERVAL_MS = 2000; // Send batched events every 2 seconds

  // ─── Session Management ─────────────────────────────────────────────────────
  function getOrCreateSessionId() {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      // Generate a UUID-like session ID
      sessionId =
        'sess_' +
        Date.now().toString(36) +
        '_' +
        Math.random().toString(36).slice(2, 9);
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  const SESSION_ID = getOrCreateSessionId();

  // ─── Event Queue (batching) ─────────────────────────────────────────────────
  let eventQueue = [];
  let flushTimer = null;

  function queueEvent(event) {
    eventQueue.push(event);
    scheduleFlush();
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, BATCH_INTERVAL_MS);
  }

  async function flush() {
    flushTimer = null;
    if (eventQueue.length === 0) return;

    const eventsToSend = [...eventQueue];
    eventQueue = [];

    // The Fetch keepalive option has a 64KB body limit.
    // Chunk into batches of 20 events to stay safely within that limit.
    const CHUNK_SIZE = 20;
    for (let i = 0; i < eventsToSend.length; i += CHUNK_SIZE) {
      const chunk = eventsToSend.slice(i, i + CHUNK_SIZE);
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
          keepalive: true,
        });
      } catch (err) {
        // On network failure push the failed chunk back for a future retry,
        // but don't retry keepalive batches to avoid infinite growth.
        console.warn('[CF Tracker] Failed to send events:', err.message);
        eventQueue = [...chunk, ...eventQueue];
        break; // stop sending further chunks this cycle
      }
    }
  }

  // Flush on page unload (handles tab close / navigation)
  window.addEventListener('beforeunload', flush);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  // ─── Event Builders ─────────────────────────────────────────────────────────
  function buildBaseEvent(type) {
    return {
      session_id: SESSION_ID,
      event_type: type,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
    };
  }

  function trackPageView() {
    const event = buildBaseEvent('page_view');
    queueEvent(event);
    console.log('[CF Tracker] page_view tracked', event.page_url);
  }

  function trackClick(e) {
    const event = {
      ...buildBaseEvent('click'),
      x: e.clientX,
      y: e.clientY,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    };
    queueEvent(event);
  }

  // ─── Initialization ─────────────────────────────────────────────────────────
  function init() {
    // Track initial page view
    trackPageView();

    // Track all clicks on the document
    document.addEventListener('click', trackClick, { capture: true });

    // Handle SPA navigation (popstate / pushState)
    const originalPushState = history.pushState.bind(history);
    history.pushState = function (...args) {
      originalPushState(...args);
      trackPageView();
    };
    window.addEventListener('popstate', trackPageView);

    console.log(
      `[CF Tracker] Initialized | session: ${SESSION_ID} | endpoint: ${ENDPOINT}`
    );
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API (optional) ──────────────────────────────────────────────────
  window.CFTracker = {
    getSessionId: () => SESSION_ID,
    flush,
  };
})();
