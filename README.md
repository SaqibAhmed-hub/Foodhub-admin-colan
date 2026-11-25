# FoodHub Admin Dashboard

Admin-only web dashboard for the FoodHub backend (Spring Boot). React 19 + Vite, plain CSS, no UI library.

**What an admin can do**
- Sign in with email + one-time code (only accounts with the ADMIN role get in).
- **Open and close the ordering portal** for today's menu from the dashboard, and see who ordered what.
- Create daily menus (date, order window, pickup window, dishes with quantities and prices) and publish them.
- Add and edit employees (grade decides the food discount), deactivate them.
- Manage the food-item catalogue.
- **Reports**: preview and download (Excel or PDF) the item-wise monthly, day-wise monthly and daily menu reports.

## Run it

You need Node 20+ and the backend running on http://localhost:8080 (see the backend README).

```bash
npm install
npm run dev          # http://localhost:5173
```

Sign in with `admin@foodhub.local`, then the code `123456` (the backend's `local` profile).
In development Vite forwards `/api` to the backend, so there is no CORS setup. Different backend address:
`BACKEND_URL=http://host:port npm run dev`.

Production build: `npm run build` (output in `dist/`). Serve `dist/` from the same host as the API
(reverse proxy `/api` to Spring Boot, with a fallback to `index.html` for page refreshes). To host it on a
different origin, set `VITE_API_BASE=https://api.example.com` at build time and add CORS to the backend.

## How "open / close the portal" works

The backend has no separate switch: ordering is open while `orderOpenTime <= now < orderCloseTime`.
The dashboard's buttons edit those times for you (current minute, India time):

| Button | What it does |
|---|---|
| Open ordering now | sets the opening time to now and asks when ordering should close (must be before pickup starts) |
| Close ordering now | sets the closing time to now. Orders already placed are kept |
| Change closing time | moves the closing time while ordering is open |
| Reopen ordering | opens again after closing, as long as pickup has not started |
| Publish & open now | for a draft menu: publishes it and opens ordering |

Employees can also just follow the schedule set on the menu; nothing needs clicking.
The timezone is fixed in `src/shared/lib/time.js` (`Asia/Kolkata`); keep it in sync with the backend.

## Code layout (by feature)

```
src/
  app/            App (routes), AppShell (sidebar)
  shared/         api client, ui kit (Button, Modal, Field, Toast...), lib (time, format, useAsync)
  features/
    auth/         OTP login, session, protected route
    dashboard/    portal control + rules (portal.js), summary tiles, kitchen sheet
    orders/       today's orders table, cancel
    employees/    list, search, add, edit
    food-items/   catalogue
    menus/        list, builder (create/edit), form rules
    reports/      3 reports: preview table + Excel/PDF download (reportsApi, reportTables)
  styles/theme.css   colour tokens and shared component styles
```

Theme: cream, cocoa, terracotta and saffron. Change the colours in the `:root` block of `src/styles/theme.css`.

## Notes

- The session token is kept in `localStorage` and lasts as long as the backend says (12 h). A 401 signs you out.
- The dashboard refreshes itself every 30 seconds.
- Not included yet: reports, CSV import of employees, image upload, copying yesterday's menu.
