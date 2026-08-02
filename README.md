# QuickNotes

A simple, mobile-first task list PWA with tags, offline support and manual sync.

- **Frontend** (`frontend/`): React + Vite (JavaScript), localForage (IndexedDB) for offline storage, lucide-react icons, installable PWA manifest.
- **Backend** (`backend/`): FastAPI + SQLModel + SQLite, managed with `uv`. Username/password auth with bearer tokens, bidirectional sync with last-write-wins conflict resolution.

## Features

- Add tasks with a name and a tag (tag input shows previously used tags, and lets you create new ones).
- Check tasks as completed; completed tasks live in a collapsible section that is hidden by default.
- Sort pending tasks by date (oldest first, default) or grouped by tag.
- Live search across task names and tags.
- Sidebar shows per-user tags; tapping a tag shows only that tag's tasks.
- Edit and delete any task (delete asks for confirmation).
- Offline-first: tasks are stored in IndexedDB (localForage). A sync button pushes local changes and pulls server changes. Conflicts resolve by "last write wins" using `updated_at`.

## Project layout

```
.
├── backend/            FastAPI + SQLModel + SQLite (uv)
│   ├── app/
│   │   ├── main.py         FastAPI app, CORS, router registration
│   │   ├── config.py       env-based settings (DATABASE_URL, CORS_ORIGINS)
│   │   ├── database.py     engine + helpers
│   │   ├── models.py       User, AuthToken, Task (soft delete)
│   │   ├── schemas.py      request/response models
│   │   ├── security.py     bcrypt hashing + bearer tokens
│   │   ├── deps.py         get_db / get_current_user
│   │   └── routers/
│   │       ├── auth.py     register / login
│   │       ├── tasks.py    CRUD
│   │       └── sync.py     bidirectional sync
│   └── tests/          pytest suite (auth, tasks, sync conflicts)
└── frontend/           React + Vite + localForage PWA
    └── src/
        ├── api.js          fetch wrapper + auth/sync endpoints
        ├── db.js           localForage helpers
        ├── hooks/          useAuth, useTasks (state + sync logic)
        └── components/     AuthScreen, Sidebar, TaskForm, TaskItem
```

## Prerequisites

- Python 3.11+ and [`uv`](https://docs.astral.sh/uv/)
- Node.js 18+ and npm

## Run locally (development)

### 1. Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The server runs at `http://localhost:8000` with an SQLite database at `backend/quicknotes.db` (created automatically).

Environment variables (optional):

- `DATABASE_URL` — SQLite/SQLAlchemy URL, default `sqlite:///./quicknotes.db`
- `CORS_ORIGINS` — comma-separated allowed origins, default `http://localhost:5173,http://127.0.0.1:5173,https://*.monkeycode-ai.live`

Run the tests:

```bash
cd backend
uv run pytest
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:5173` and proxies `/api/*` to `http://localhost:8000`, so no CORS issues in development.

### 3. Try it

Open `http://localhost:5173`, create an account, and add tasks. The sync button in the top bar pushes/pulls changes; it also syncs automatically on load when online.

## Offline & sync behavior

- All task data is read/written through IndexedDB (localForage), so the app works with no connection.
- Every task carries `created_at` and `updated_at` (UTC ISO-8601). Deletions are soft deletes (`deleted_at`).
- The sync button sends all locally modified tasks (including tombstones) and receives every task changed on the server since the last sync.
- Conflicts are resolved per task: whichever version has the newer `updated_at` wins.
- After a successful sync, local tombstones older than the server time are purged.

## API

Base path: `/api`. All task/sync endpoints require `Authorization: Bearer <token>`.

| Method | Path              | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| POST   | `/auth/register`  | Create account, returns a bearer token       |
| POST   | `/auth/login`     | Log in, returns a bearer token               |
| GET    | `/tasks`          | List the current user's tasks                |
| POST   | `/tasks`          | Create a task `{name, tag}`                  |
| PATCH  | `/tasks/{id}`     | Update `{name?, tag?, completed?}`           |
| DELETE | `/tasks/{id}`     | Soft-delete a task                           |
| POST   | `/sync`           | Bidirectional sync (last-write-wins)         |
| GET    | `/health`         | Health check                                 |

## Production deployment

You mentioned deploying the backend on a VPS and the frontend on Cloudflare Pages.

- **Backend (VPS):** run `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000` behind a reverse proxy (e.g. Nginx/Caddy) over HTTPS. Set `CORS_ORIGINS` to your Cloudflare Pages domain.
- **Frontend (Cloudflare Pages):** build with `npm run build` (output in `frontend/dist`). Since the frontend and backend are on different origins, set the API base URL at build time:

  ```bash
  VITE_API_URL=https://api.your-vps-domain.com/api npm run build
  ```

  The Vite proxy is only used in development; in production the app calls the backend directly.
