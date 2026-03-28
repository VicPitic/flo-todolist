# Flo

Flo is a local-first task manager inspired by HubSpot Tasks.  
It uses a React + Vite frontend with an Express backend that reads/writes a local `db.json` file.

## Features

- HubSpot-style task table UI (filters, tabs, search, sortable columns)
- Left sidebar with live task counts (`Open`, `Due today`, `Due this week`, `High priority`)
- Slide-in panel for creating and editing tasks
- Contacts support with local contacts API and contact association on tasks
- Bulk task actions (check/uncheck/delete selected)
- Persistent storage in local `db.json` (no external DB required)

## Tech Stack

- React + Vite
- Tailwind CSS + DaisyUI
- Express + CORS
- Heroicons
- UUID
- Concurrently

## Getting Started

### Bun (recommended)

This repo is Bun-ready (`packageManager` + `bun.lock` are already present).

```bash
bun install
bun run dev
```

### npm (alternative)

```bash
npm install
npm run dev
```

This starts:

- Express API at `http://localhost:3005`
- Vite frontend at `http://localhost:5173`

## Scripts

- `bun run dev` / `npm run dev` - run backend and frontend concurrently
- `bun run server` / `npm run server` - run only Express API
- `bun run build` / `npm run build` - production frontend build
- `bun run preview` / `npm run preview` - preview production build

## Data Storage

All data is stored in the root-level `db.json`.

Expected top-level shape:

```json
{
  "tasks": [],
  "contacts": []
}
```

### Task shape

```json
{
  "id": "uuid",
  "title": "Call Charlotte Arrowood",
  "type": "Call",
  "priority": "High",
  "dueDate": "2024-02-23",
  "dueTime": "08:00",
  "status": "open",
  "notes": "",
  "contact": {
    "name": "Charlotte Arrowood",
    "avatarInitials": "CA",
    "avatarColor": "#E57373"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Contact shape

```json
{
  "id": "uuid",
  "name": "Charlotte Arrowood",
  "avatarInitials": "CA",
  "avatarColor": "#E57373"
}
```

## API

Base URL: `http://localhost:3005/api`

- `GET /tasks` - returns all tasks
- `POST /tasks` - replaces all tasks (request body must be an array)
- `GET /contacts` - returns all contacts
- `POST /contacts` - replaces all contacts (request body must be an array)

## Project Structure

```text
flo/
  server/
    index.js
  src/
    App.jsx
    components/
      Sidebar.jsx
      TaskPanel.jsx
      ContactsPanel.jsx
      DatePicker.jsx
  db.json
  requirements.md
```

## Notes

- This project is intentionally local-first: every create/edit/delete writes back to `db.json`.
- If you want to reseed demo data, update `db.json` and restart the server.
