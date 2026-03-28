# Flo

Flo is a local-first task manager inspired by HubSpot Tasks.  
It uses a React + Vite frontend and stores data in browser `localStorage`.

## Features

- HubSpot-style task table UI (filters, tabs, search, sortable columns)
- Left sidebar with live task counts (`Open`, `Due today`, `Due this week`, `High priority`)
- Slide-in panel for creating and editing tasks
- Contacts support with contact association on tasks
- Bulk task actions (check/uncheck/delete selected)
- Persistent local browser storage (no external DB required)

## Tech Stack

- React + Vite
- Tailwind CSS + DaisyUI
- Heroicons
- UUID

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

This starts the Vite frontend at `http://localhost:5173`.

## Scripts

- `bun run dev` / `npm run dev` - run frontend only
- `bun run dev:legacy` / `npm run dev:legacy` - run legacy Express API + frontend
- `bun run server` / `npm run server` - run only legacy Express API
- `bun run build` / `npm run build` - production frontend build
- `bun run preview` / `npm run preview` - preview production build

## Data Storage

All app data is stored in browser `localStorage` with these keys:

- `flo.tasks.v1`
- `flo.contacts.v1`

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

## Project Structure

```text
flo/
  src/
    data/
      localStore.js
    App.jsx
    components/
      Sidebar.jsx
      TaskPanel.jsx
      ContactsPanel.jsx
      DatePicker.jsx
  server/
    index.js
  db.json
  requirements.md
```

## Notes

- This project is intentionally local-first: every create/edit/delete writes to browser `localStorage`.
- Data is scoped to each browser profile/device and is not synced across users/devices.
- `server/index.js` and `db.json` are kept as legacy artifacts and are not required for deployment.
