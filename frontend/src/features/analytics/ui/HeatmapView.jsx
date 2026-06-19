/**
 * analytics/ui/HeatmapView.jsx
 * ─────────────────────────────
 * Pure UI — uses hooks for all data, renders canvas heatmap + controls.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHeatmapPages, useHeatmap } from '../hooks/useHeatmap';

// ─── Canvas Renderer (pure function, no React state) ──────────────────────────
function drawHeatmap(canvas, clicks, width, height) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = '#111113';
  ctx.fillRect(0, 0, width, height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  if (clicks.length === 0) return;

  // Scale coordinates relative to viewport size
  const scaled = clicks.map((c) => ({
    x: c.viewport_width ? (c.x / c.viewport_width) * width : c.x,
    y: c.viewport_height ? (c.y / c.viewport_height) * height : c.y,
  }));

  // Build density grid
  const CELL = 40;
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const density = new Array(cols * rows).fill(0);
  scaled.forEach(({ x, y }) => {
    const ci = Math.min(Math.floor(x / CELL), cols - 1);
    const ri = Math.min(Math.floor(y / CELL), rows - 1);
    density[ri * cols + ci]++;
  });
  const maxDensity = Math.max(...density, 1);

  // Draw blobs
  scaled.forEach(({ x, y }) => {
    const ci = Math.min(Math.floor(x / CELL), cols - 1);
    const ri = Math.min(Math.floor(y / CELL), rows - 1);
    const d = density[ri * cols + ci] / maxDensity;
    const r = 24 + d * 16;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);

    if (d < 0.33) {
      grad.addColorStop(0, `rgba(59,130,246,${Math.min(0.5 + d, 1)})`);
      grad.addColorStop(1, 'rgba(59,130,246,0)');
    } else if (d < 0.66) {
      grad.addColorStop(0, `rgba(245,158,11,${Math.min(0.5 + d * 0.4, 1)})`);
      grad.addColorStop(1, 'rgba(245,158,11,0)');
    } else {
      grad.addColorStop(0, `rgba(239,68,68,${Math.min(0.6 + d * 0.4, 1)})`);
      grad.addColorStop(1, 'rgba(239,68,68,0)');
    }

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // White dot markers
  ctx.globalCompositeOperation = 'source-over';
  scaled.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  });
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function HeatmapView() {
  const [selectedPage, setSelectedPage] = useState('');
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);

  // Data from hooks — no fetch logic in this component
  const { pages, loading: pagesLoading, error: pagesError } = useHeatmapPages();
  const { clicks, loading: clicksLoading, error: clicksError } = useHeatmap(selectedPage);

  // Auto-select the first page once pages load
  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage]);

  // Redraw canvas on data or resize
  const redraw = useCallback(() => {
    if (!wrapRef.current) return;
    const w = wrapRef.current.clientWidth || 800;
    const h = Math.max(400, Math.round(w * 0.56));
    drawHeatmap(canvasRef.current, clicks, w, h);
  }, [clicks]);

  useEffect(() => {
    redraw();
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [redraw]);

  const error = pagesError || clicksError;
  const uniqueSessions = new Set(clicks.map((c) => c.session_id)).size;

  return (
    <div className="fade-in">
      {/* Stat Cards */}
      <div className="stats-row">
        <div className="stat-card accent">
          <div className="stat-label">Pages Tracked</div>
          <div className="stat-value">{pages.length}</div>
          <div className="stat-sub">with click data</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Clicks on Page</div>
          <div className="stat-value">{clicks.length}</div>
          <div className="stat-sub">for selected URL</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Unique Sessions</div>
          <div className="stat-value">{uniqueSessions}</div>
          <div className="stat-sub">clicked on page</div>
        </div>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: '0.5rem' }}>
        <div>
          <div className="section-title">Click Heatmap</div>
          <div className="section-sub">Visual representation of where users click</div>
        </div>
      </div>

      {/* Page selector */}
      <div className="heatmap-controls">
        <select
          id="heatmap-page-select"
          className="heatmap-select"
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          disabled={pagesLoading || pages.length === 0}
        >
          {pagesLoading && <option>Loading pages…</option>}
          {!pagesLoading && pages.length === 0 && <option>No pages with click data</option>}
          {pages.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
          {clicks.length} click{clicks.length !== 1 ? 's' : ''} recorded
        </span>
      </div>

      {error && <div style={{ color: 'var(--red)', padding: '1rem' }}>Error: {error}</div>}

      {/* Canvas */}
      <div className="heatmap-canvas-wrap" ref={wrapRef} id="heatmap-canvas-wrap">
        {clicksLoading && (
          <div className="loading-wrap" style={{ position: 'absolute', inset: 0, background: 'var(--bg2)', zIndex: 2 }}>
            <div className="spinner" />
          </div>
        )}
        {!selectedPage && !pagesLoading && (
          <div className="empty-state">
            <div className="empty-icon">🖱</div>
            <div className="empty-title">No click data yet</div>
            <div className="empty-sub">Open the demo page and click around to generate heatmap data</div>
          </div>
        )}
        <canvas ref={canvasRef} id="heatmap-canvas" style={{ display: 'block', width: '100%' }} />
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span>Low</span>
        <div className="heatmap-legend-bar" />
        <span>High</span>
        <span style={{ marginLeft: '1rem', color: 'var(--text3)' }}>Click density</span>
      </div>

      {/* Recent clicks table */}
      {clicks.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="section-header">
            <div className="section-title">Recent Clicks</div>
          </div>
          <div className="table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table id="clicks-table">
              <thead>
                <tr>
                  <th>#</th><th>Session</th><th>X</th><th>Y</th><th>Viewport</th><th>Time</th>
                </tr>
              </thead>
              <tbody>
                {clicks.slice(0, 50).map((c, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                    <td>
                      <code style={{ fontSize: '0.72rem', color: 'var(--accent-light)' }}>
                        {c.session_id ? c.session_id.slice(-12) : '—'}
                      </code>
                    </td>
                    <td>{c.x}</td>
                    <td>{c.y}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                      {c.viewport_width}×{c.viewport_height}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
