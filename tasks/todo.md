# FoodHub Admin Dashboard: Plan

Stack: React 19 (JavaScript/JSX) · Vite · React Router · plain CSS (warm theme tokens). No UI kit, no state library.
Backend: the existing Spring Boot API (`/api/v1/...`). Admin role only.

## Decisions
- Admin only: the OTP login is accepted only when the returned role is ADMIN; otherwise no session is stored.
- No separate "portal" endpoint exists in the backend: ordering is open when `orderOpenTime <= now < orderCloseTime`.
  "Open ordering now" / "Close ordering now" therefore update the menu's open/close time to the current minute
  (organisation timezone Asia/Kolkata), and publish the menu first if it is still a draft.
- Dev: Vite proxies `/api` to http://localhost:8080 (no CORS needed).

## Structure (by feature)
```
src/
  app/        App (routes), AppShell (sidebar)
  shared/     api client, ui kit (Button, Modal, Field, Badge, Toast...), lib (time, format, useAsync)
  features/
    auth/        login (OTP), session, protected route
    dashboard/   portal control (open/close), today's summary + kitchen sheet
    orders/      orders table + cancel (used by dashboard)
    employees/   list/search, create, edit/deactivate
    food-items/  catalogue
    menus/       list, create/edit builder, publish
```

## Checklist
- [x] Scaffold, theme, shared API client + UI kit
- [x] Auth (admin only)
- [x] Dashboard + open/close portal
- [x] Employees
- [x] Food items
- [x] Menus (list, builder, publish)
- [x] Verify (see Review)

## Review
**Verified (in the build sandbox)**
- The real source bundles cleanly (esbuild; every import resolves, JSX parses, strict `.js` = plain JS check).
- 19-step browser test in Chromium against a mock of the Spring API (same paths, response shapes, error codes):
  redirect to login; non-admin rejected and nothing stored; wrong OTP; admin login; create menu + publish;
  form validation; Open ordering now; orders shown with the Fresher discount; closing time must be before pickup;
  Close ordering now (with confirm); Reopen; cancel an order; qty cannot go below ordered; employee search,
  duplicate-code error, create, deactivate; food item add/retire; expired session -> login; 390px mobile has no sideways scroll.
- Bugs found and fixed by that test: sidebar stretched the page on phones; table headers not aligned with right-aligned numbers;
  "Close now" refused within a minute of opening (now shifts the open time back a minute).

**NOT verified**
- `npm install`, `vite build` and the dev server (npm registry blocked in the sandbox). Routing was tested with a stand-in for
  react-router-dom's API, not the real package.
- Against the real Spring backend (only a mock). Field names follow the backend source.
- Web fonts (Fraunces, DM Sans) load from Google Fonts; screenshots used fallback fonts.

## Reports page
- [x] `apiDownload()` in the API client (fetch with token, save through an object URL, file name from Content-Disposition)
- [x] `features/reports`: reportsApi, reportTables, ReportsPage, reports.css; sidebar link + `/reports` route
- [x] Verified: bundled the real source; 11-step Chromium test against the mock (preview, Excel + PDF downloads with the server's file names, month change,
      empty month, zero-amount day row, daily 404 message with downloads disabled, derived columns, no sideways scroll at 390px, expired session -> login).
- Bug found by the test and fixed: switching tabs rendered the previous report's data with the new tab's columns (crash on Daily).
- Not verified: real `npm install` / `vite build`, and the real Spring backend (mock only).
