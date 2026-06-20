/**
 * middleware/auth.js
 * ──────────────────
 * Optional API key authentication for dashboard read endpoints.
 *
 * How it works:
 *   - If API_KEY is NOT set in .env → auth is disabled (great for local dev)
 *   - If API_KEY IS set → the request must include header: x-api-key: <key>
 *
 * The tracker (POST /api/events) is intentionally exempt — it's a public
 * collection endpoint, just like Google Analytics or Mixpanel pixels.
 * Only the dashboard READ endpoints are protected.
 */
function auth(req, res, next) {
  const apiKey = process.env.API_KEY;

  // No API_KEY configured → auth is disabled (dev/demo mode)
  if (!apiKey) return next();

  const provided = req.headers['x-api-key'];

  if (!provided) {
    return res.status(401).json({
      error: 'Unauthorized: x-api-key header is required',
    });
  }

  if (provided !== apiKey) {
    return res.status(403).json({
      error: 'Forbidden: invalid API key',
    });
  }

  next();
}

module.exports = auth;
