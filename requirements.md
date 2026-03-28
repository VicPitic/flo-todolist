Rebuild the "Flo" todo app to match HubSpot's Tasks UI as closely as possible (see design reference below). Replace the Kanban board with a table-based task list. Keep the existing Express + db.json backend.

## Reference UI (HubSpot Tasks)
The app should look and feel like HubSpot's task manager:
- Clean white/light gray UI
- Left sidebar with task count filters
- Main content area with a filterable, sortable table
- A slide-in panel from the right to create/edit tasks
- Tabs across the top of the table: "All", "Due today", "Overdue", "Upcoming"

---

## Stack (keep from before)
- React + Vite
- DaisyUI + Tailwind CSS
- Express backend with db.json
- Google Fonts: "Inter" for body (match HubSpot's clean sans-serif feel)
- concurrently to run both servers

---

## Data Model (update db.json)
Each task object:
```json
{
  "id": "uuid",
  "title": "Call Charlotte Arrowood",
  "type": "Call",              // "Call" | "Email" | "To-do"
  "priority": "High",          // "High" | "Medium" | "Low" | null
  "dueDate": "2024-02-23",
  "dueTime": "08:00",
  "status": "open",            // "open" | "complete"
  "notes": "",
  "contact": {
    "name": "Charlotte Arrowood",
    "avatarInitials": "CA",
    "avatarColor": "#E57373"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```
Contacts should also be stored separately in db.json:
```json
{
  "contacts": [
    { "id": "uuid", "name": "Charlotte Arrowood", "avatarInitials": "CA", "avatarColor": "#E57373" },
    ...
  ]
}
```
Seed db.json with 8–10 realistic sample tasks and 6–8 contacts.

---

## Layout

### Left Sidebar
- App logo/name "Flo" at the top (DM Serif Display font, teal accent color)
- Filter links with counts (pulled live from tasks data):
  - Open tasks
  - Due today
  - Due this week
  - High priority
- A "More" expandable section
- Section: QUEUES (static labels for now: "Hot leads", "Call later" with fake counts)
- "+ Add queue" link at the bottom
- Sidebar background: #F5F8FA (HubSpot's light blue-gray)
- Active item highlighted with a left border accent in teal

### Top Bar (inside main content)
- Page title: "Tasks" (large, bold)
- Right side: "Actions" dropdown button (ghost style), "Start queue" outlined button, "Create task" filled teal/orange button
- Below that: tab bar with "All", "Due today", "Overdue", "Upcoming" — clicking filters the table

### Table
Columns (match HubSpot exactly):
| ☐ | STATUS | TITLE | TYPE | ASSOCIATED WITH | PRIORITY | DUE DATE |

- Checkbox column (select all / individual)
- STATUS: a circular check icon button — clicking it toggles the task complete (strikes through the row, grays it out)
- TITLE: task name, clickable to open the edit panel
- TYPE: icon only — phone icon for Call, email icon for Email, checkmark icon for To-do (use DaisyUI icons or Heroicons)
- ASSOCIATED WITH: contact avatar (colored circle with initials) + contact name in teal/link style
- PRIORITY: colored dot + label ("High" in red dot, "Medium" in yellow, "Low" in gray)
- DUE DATE: formatted date string. Overdue dates shown in red (like "Feb 23, 2019"). Future dates in normal gray.

- Rows have a subtle hover state (light blue-gray background)
- Overdue rows: due date text in red
- Completed rows: title has strikethrough, row is grayed out
- Table is sortable by clicking column headers (client-side sort, with up/down arrow icons)
- Empty state: centered illustration placeholder + "You're all caught up on tasks. Nice work." message

### Search Bar
- Top right of table area: search input with magnifying glass icon, placeholder "Search for a task"
- Filters tasks in real-time by title

---

## Create / Edit Task Panel
Slides in from the right as a fixed panel (not a modal). Width: ~460px. Has an overlay behind it.

Fields (match HubSpot's "Create task" panel exactly):
- Header: "Create task" or "Edit task" in teal panel header with X close button
- Task Title * — large text input at the top
- Task Type * — dropdown: "Call", "Email", "To-do"
- Priority * — dropdown with colored dots: "High" (red), "Medium" (yellow), "Low" (gray), "None"
- Associate with contact — searchable dropdown that shows contacts from db.json contacts list. Shows avatar + name. Supports selecting one contact.
- Due date — date picker input
- Due time — time input (e.g. "8:00 AM")
- Notes — multiline textarea
- Footer buttons: "Create" (filled teal/orange), "Create and add another" (outlined), "Cancel" (text button)

For editing: pre-fill all fields. Show a "Delete task" option in the header or footer.

---

## Contacts Management (lightweight)
- Contacts are stored in db.json under a "contacts" key
- The panel's "Associate with contact" field searches this list
- No separate contacts page needed — just the data and the dropdown

---

## API Endpoints (Express, port 3005)
- GET /api/tasks — return all tasks
- POST /api/tasks — replace all tasks (send full array)
- GET /api/contacts — return all contacts
- POST /api/contacts — replace all contacts

---

## Styling Details
- Background: white (#FFFFFF) for main content, #F5F8FA for sidebar
- Primary accent: #00BDA5 (HubSpot teal) for buttons and active states
- CTA button "Create task": #FF7A59 (HubSpot orange)
- Font: Inter (Google Fonts), weights 400/500/600
- Table header: uppercase, small, gray, letter-spaced
- Borders: light gray (#E5E8EB) for table rows and sidebar dividers
- Shadows: very subtle on the slide-in panel

---

## Dev Setup
- package.json with all deps including: react, vite, tailwindcss, daisyui, express, cors, uuid, concurrently
- `npm run dev` starts both servers with concurrently
- db.json pre-seeded with sample data