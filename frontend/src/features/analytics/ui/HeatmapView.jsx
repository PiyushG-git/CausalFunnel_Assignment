/**
 * analytics/ui/HeatmapView.jsx
 * ─────────────────────────────
 * Pure UI — uses hooks for all data, renders canvas heatmap + controls.
 * Updated to match the new light-mode minimal design system.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHeatmapPages, useHeatmap } from '../hooks/useHeatmap';

// ─── Canvas Renderer ──────────────────────────────────────────────────────────
function drawHeatmap(canvas, clicks, width, height) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  // Use a very light grey for the canvas background to match light theme
  ctx.fillStyle = '#fdfdfd';
  ctx.fillRect(0, 0, width, height);

  // Subtle grid (darker than dark mode grid)
  ctx.strokeStyle = 'rgba(0,0,0,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  if (clicks.length === 0) return;

  const scaled = clicks.map((c) => ({
    x: c.viewport_width ? (c.x / c.viewport_width) * width : c.x,
    y: c.viewport_height ? (c.y / c.viewport_height) * height : c.y,
  }));

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

  // In a light theme, we use "multiply" or "darken" for heatmaps, but standard gradient blobs also work.
  // We'll keep the blue/orange/red blobs but adjust opacities for light mode visibility.
  scaled.forEach(({ x, y }) => {
    const ci = Math.min(Math.floor(x / CELL), cols - 1);
    const ri = Math.min(Math.floor(y / CELL), rows - 1);
    const d = density[ri * cols + ci] / maxDensity;
    const r = 24 + d * 16;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);

    // Darker, more saturated colors for light background
    if (d < 0.33) {
      grad.addColorStop(0, `rgba(59,130,246,${Math.min(0.6 + d, 1)})`);
      grad.addColorStop(1, 'rgba(59,130,246,0)');
    } else if (d < 0.66) {
      grad.addColorStop(0, `rgba(245,158,11,${Math.min(0.6 + d * 0.4, 1)})`);
      grad.addColorStop(1, 'rgba(245,158,11,0)');
    } else {
      grad.addColorStop(0, `rgba(239,68,68,${Math.min(0.7 + d * 0.4, 1)})`);
      grad.addColorStop(1, 'rgba(239,68,68,0)');
    }

    // "multiply" blends colors onto a light background better than "lighter"
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Black dot markers for individual clicks
  ctx.globalCompositeOperation = 'source-over';
  scaled.forEach(({ x, y }) => {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
  });
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function HeatmapView() {
  const [selectedPage, setSelectedPage] = useState('');
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);

  const { pages, loading: pagesLoading, error: pagesError } = useHeatmapPages();
  const { clicks, loading: clicksLoading, error: clicksError } = useHeatmap(selectedPage);

  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage]);

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
      <div className="page-subtitle">Visual Analytics</div>
      <h1 className="page-title">CLICK HEATMAP DASHBOARD</h1>

      {/* Stat Cards (matching the new Session cards) */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Pages Tracked</div>
          <div className="stat-value">{pages.length.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clicks on Page</div>
          <div className="stat-value">{clicks.length.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique Sessions</div>
          <div className="stat-value">{uniqueSessions.toLocaleString()}</div>
        </div>
      </div>

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
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {clicks.length} click{clicks.length !== 1 ? 's' : ''} recorded
        </span>
      </div>

      {error && <div style={{ color: 'var(--red)', padding: '1rem' }}>Error: {error}</div>}

      <div className="heatmap-canvas-wrap" ref={wrapRef} id="heatmap-canvas-wrap">
        {clicksLoading && (
          <div className="loading-wrap" style={{ position: 'absolute', inset: 0, background: 'var(--bg-panel)', zIndex: 2 }}>
            <div className="spinner" />
          </div>
        )}
        {!selectedPage && !pagesLoading && (
          <div className="empty-state">
            <div className="empty-title">No click data yet</div>
            <p>Open the demo page and click around to generate heatmap data.</p>
          </div>
        )}
        <canvas ref={canvasRef} id="heatmap-canvas" style={{ display: 'block', width: '100%' }} />
      </div>
    </div>
  );
}
