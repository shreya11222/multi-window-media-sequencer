# Multi-Window Media Sequencer with Sync Playback

A full-stack assignment implementation using **React + Golang + SQLite**.

## Features

- Four seeded display windows.
- Independent playlists per window.
- Image and video playback.
- Continuous playlist playback.
- Five-hour cycle logic: each window treats its playback timeline as a 5-hour cycle and repeats its playlist instead of becoming blank.
- Dynamic add/remove playlist items through the UI.
- Server-timestamped global sync: selecting a media item and pressing **Sync Selected Media** makes every window render the same media and calculate its playback position from the shared server start time.
- After sync expires, each window automatically returns to its own playlist timeline.
- Persistent SQLite database.
- CORS-enabled Go API.
- Dockerfile for backend deployment.

## Architecture

```text
React Frontend
     |
     | REST
     v
Golang / Gin API
     |
     v
SQLite persistent storage
```

## Requirements

- Go 1.22+
- Node.js 18+
- npm

## Run locally

### 1. Backend

```bash
cd backend
go mod download
go run .
```

Backend runs on:

```text
http://localhost:8080
```

Health check:

```text
http://localhost:8080/api/health
```

The database file `media_sequencer.db` is created automatically.

### 2. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

For a different backend URL, copy `.env.example` to `.env` and change:

```text
VITE_API_URL=https://YOUR-BACKEND-URL/api
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/windows` | Get display windows |
| GET | `/api/windows/:id/playlist` | Get a window playlist |
| GET | `/api/media` | Get all media |
| POST | `/api/windows/:id/media` | Add media to a window |
| DELETE | `/api/windows/:id/media/:mediaId` | Remove media |
| POST | `/api/sync` | Start global media sync |
| GET | `/api/sync` | Read current sync state |

## Sync design

The backend stores a single sync state containing:

- selected media ID
- UTC `startedAt`
- media duration
- active state

When a sync begins, all browser windows independently calculate:

```text
elapsed = current_time - startedAt
```

The selected media is rendered at that elapsed position. This avoids relying on several browser `play()` calls happening at exactly the same moment.

Once:

```text
elapsed >= duration
```

the sync state is no longer active and every display falls back to its own playlist.

## Five-hour cycle design

Each display has an independent elapsed playback timeline. The player calculates:

```text
cycleElapsed = elapsed % (5 * 60 * 60)
```

and then maps that position into the window's playlist. When the five-hour boundary is reached, the timeline starts again from the beginning.

If the playlist's own total duration is shorter than five hours, it repeats within the five-hour cycle rather than going blank.

## Seed data

The backend seeds four windows and six demo media items on first run. The sample media URLs are public demo assets to keep the repository small.

For production, replace them with your own hosted media URLs or an object-storage solution.

## Deployment

### Backend

The included `backend/Dockerfile` can be used on Docker-capable hosts.

Important: SQLite requires persistent disk/storage. If your hosting provider has an ephemeral filesystem, either attach persistent storage or switch the database to PostgreSQL.

Environment variables:

```text
PORT=8080
DB_PATH=media_sequencer.db
```

### Frontend

Build:

```bash
cd frontend
npm install
npm run build
```

Deploy the generated `frontend/dist` folder to a static host such as Vercel or Netlify.

Set:

```text
VITE_API_URL=https://YOUR-GO-BACKEND/api
```

## Assumptions

- Media duration is stored in seconds and is used for images and as a fallback scheduling duration for videos.
- The browser is allowed to autoplay muted video.
- The five-hour requirement refers to the logical playback cycle, not a requirement to keep a browser tab open for five hours during testing.
- The backend's sync timestamp is the source of truth for synchronization.
- Playlist polling is used for simplicity; the frontend refreshes playlist state every four seconds.


### Windows setup — no GCC required

This version uses the pure-Go SQLite driver `github.com/glebarez/sqlite`, so you do **not** need GCC, MinGW, or CGO.

From the `backend` folder:

```powershell
go mod tidy
go run .
```
