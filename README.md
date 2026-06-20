# CausalFunnel — User Analytics Application

> A full-stack user analytics platform with real-time session tracking, event recording, and an interactive dashboard featuring sessions view and click heatmaps.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js · Express.js · Mongoose |
| **Database** | MongoDB |
| **Frontend** | React · Vite |
| **Tracking Script** | Vanilla JavaScript (zero dependencies) |
| **Demo Page** | Plain HTML |

---

## Project Structure

```
CausalFunnel_Assignment/
├── .gitignore                        # OS & editor patterns (global)
│
├── backend/
│   ├── .gitignore                    # node_modules/, .env, *.log
│   ├── app.js                        # Express app: middleware, routes, error handlers
│   ├── server.js                     # Entry point: DB connect → HTTP listen
│   ├── .env                          # Environment config (git-ignored)
│   ├── .env.example                  # Template for env vars (committed)
│   └── src/
│       ├── models/Event.js           # Mongoose schema
│       ├── routes/events.js          # API route definitions
│       └── controllers/
│           └── eventController.js   # Business logic & DB queries
│
├── frontend/
│   ├── .gitignore                    # node_modules/, dist/, .vite/
│   ├── index.html
│   ├── vite.config.js                # Vite + proxy /api → localhost:5000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                   # Root layout + sidebar navigation
│       ├── index.css                 # Global design system / tokens
│       └── features/
│           └── analytics/
│               ├── service/
│               │   └── api.js        # All fetch calls (analyticsApi)
│               ├── hooks/
│               │   ├── useSessions.js    # useSessions, useSessionEvents
│               │   └── useHeatmap.js     # useHeatmapPages, useHeatmap
│               └── ui/
│                   ├── SessionsView.jsx  # Sessions table + event journey
│                   └── HeatmapView.jsx   # Click heatmap (canvas)
│
├── tracker/
│   └── tracker.js                    # Embeddable analytics script
├── demo/
│   └── index.html                    # Demo e-commerce test page
└── README.md
```

---

## Setup & Running

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally on `mongodb://localhost:27017`

---

### 1. Backend

```bash
cd backend
npm install
npm start
# Server → http://localhost:5000
```

For development with hot-reload:
```bash
npm run dev
```

---

### 2. Frontend (Dashboard)

```bash
cd frontend
npm install
npm run dev
# Dashboard → http://localhost:5173
```

---

### 3. Demo Page

> ⚠️ **Important:** Serve from the **project root** (not the `demo/` folder).
> The tracker script uses a relative path `../tracker/tracker.js` which must resolve correctly.

```bash
# From project root:
npx serve . -p 3000
# Then open: http://localhost:3000/demo/index.html
```

> **Note:** The tracker sends events to `http://localhost:5000/api/events`. Start the backend first.

> **Note:** The tracker sends events to `http://localhost:5000/api/events`. Start the backend first.

---

## Deployment Guide (Free Tier)

This application is ready to be deployed to production using free tier services.

### 1. Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free M0 cluster.
2. In Network Access, whitelist `0.0.0.0/0` (Allow access from anywhere).
3. In Database Access, create a database user and password.
4. Click **Connect** → **Connect your application** and copy the `MONGODB_URI` connection string.

### 2. Backend (Render)
1. Push this repository to GitHub.
2. Go to [Render](https://render.com/) and create a new **Web Service**.
3. Connect your GitHub repo and select the `backend` directory (using the "Root Directory" setting).
4. Set the Build Command to `npm install` and Start Command to `npm start`.
5. Add Environment Variables:
   - `MONGODB_URI` = *(your Atlas connection string)*
   - `API_KEY` = *(create a secure random string, e.g., `super_secret_key_123`)*
6. Deploy! Once live, copy your backend URL (e.g., `https://causalfunnel-backend.onrender.com`).
   *Note: In your Render environment variables, later set `FRONTEND_URL` to your Vercel URL to restrict CORS for the dashboard.*

### 3. Frontend Dashboard (Vercel)
1. Go to [Vercel](https://vercel.com/) and import your GitHub repository.
2. Edit the **Root Directory** to be `frontend`.
3. Add Environment Variables:
   - `VITE_API_URL` = `https://causalfunnel-backend.onrender.com/api` *(replace with your Render URL)*
   - `VITE_API_KEY` = *(the same API_KEY you set in Render)*
4. Deploy! Your dashboard is now live.

### 4. Demo Page Integration
To track data on any live website (like the demo page), update the script tag in your HTML to point to your deployed backend URL:

```html
<script 
  src="https://causalfunnel-backend.onrender.com/tracker.js" 
  data-endpoint="https://causalfunnel-backend.onrender.com/api/events">
</script>
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events` | Ingest events (single or array) |
| `GET` | `/api/sessions` | List all sessions with stats |
| `GET` | `/api/sessions/:id/events` | Event journey for a session |
| `GET` | `/api/heatmap?page_url=<url>` | Click coordinates for a page |
| `GET` | `/api/heatmap/pages` | All pages with click data |
| `GET` | `/health` | Health check |

### Event Payload Schema

```json
{
  "session_id": "sess_abc123_xyz",
  "event_type": "click",
  "page_url": "http://localhost:3000/demo/index.html",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "x": 450,
  "y": 320,
  "viewport_width": 1440,
  "viewport_height": 900,
  "user_agent": "Mozilla/5.0 ..."
}
```

---

## Data Pipeline

```
Demo Page (demo/index.html)
  └── tracker.js          POST http://localhost:5000/api/events
        └── backend/app.js  → routes/events.js → eventController.js → MongoDB

Dashboard (localhost:5173)
  └── features/analytics/
        ├── service/api.js     fetch('/api/...')  [proxied by Vite]
        ├── hooks/             useSessions / useHeatmap
        └── ui/                SessionsView / HeatmapView
              └── Vite proxy   /api → http://localhost:5000
                    └── backend/app.js → routes → controller → MongoDB
```

---

## Dashboard Features

### Sessions View
- Summary stats: total sessions, events, clicks, avg events/session
- Table showing all sessions sorted by most recent
- Clicking a row opens an animated **event timeline** (user journey)

### Heatmap View
- Dropdown to select any tracked page URL
- **Canvas-based heatmap** with density coloring:
  - 🔵 Blue = low density
  - 🟠 Orange = medium density
  - 🔴 Red = high density (hotspot)
- Recent clicks data table with coordinates and session info

---

## Tracking Script Usage

Add to any webpage:

```html
<script
  src="path/to/tracker.js"
  data-endpoint="http://localhost:5000/api/events">
</script>
```

### What it tracks:
- **`page_view`** — fired on page load and SPA navigation
- **`click`** — every user click with x/y coordinates + viewport size

### Session Management:
- Session ID stored in `localStorage` (`cf_session_id`)
- Events batched and sent every 2 seconds in chunks of 20
- Flush on tab close / visibility change via `keepalive` fetch

---

## Assumptions & Trade-offs

| Decision | Rationale |
|---|---|
| **Event batching (2s)** | Reduces network requests; slight delay acceptable for analytics |
| **`localStorage` for session** | Persists across page refreshes; tab-scoped |
| **Canvas heatmap** | More performant than DOM-heavy alternatives for many points |
| **No auth on POST /events** | Simplified for assignment scope, functions like a public tracking pixel |
| **Optional API Key** | Dashboard read endpoints are protected by `x-api-key` if `API_KEY` is set in env |
| **CORS open for tracker** | Allows any origin to track; dashboard API is restricted to frontend origins |
| **Relative coordinates stored** | Store `x/y` with `viewport_width/height` to normalize across screen sizes |
| **Features architecture** | Co-locates hooks, services, UI per domain — scales cleanly |
| **app.js / server.js split** | `app.js` is testable without starting DB; `server.js` only boots |

---

## Future Improvements

- [ ] WebSocket-based live event streaming
- [ ] Session replay (record and replay user actions)
- [ ] Funnel analysis (conversion tracking)
- [ ] Authentication + multi-tenant support
- [ ] Time range filters on dashboard
- [ ] Export data as CSV
- [ ] Docker Compose for backend + MongoDB
