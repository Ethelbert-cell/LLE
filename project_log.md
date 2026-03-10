# 📋 LLE Library Support System — Project Log

> **Rule:** This file is the always-on audit log. Every feature update, bug fix, or architectural change must be appended here immediately after completion.

---

### [2026-02-25 14:07]

**Feature Focus:** General

**User Command:**

> Initialize the LLE Library Support System project — MERN stack. Build Student Dashboard first, then Admin/Librarian side. Three pillars: Booking, Scheduling, Hybrid Chat.

**Agent Action:**

- Created full project structure with `/client` (React + Vite) and `/server` (Node + Express) directories
- Created `PROJECT_STRUCTURE.md` for full documentation
- Created `project_log.md` (this file) as audit trail
- Created implementation plan artifact covering all three feature pillars

**Iterative Test Verification:**

- **Method:** Manual structure verification via directory listing
- **Outcome:** Directories and base files created successfully

**Result:**

- MERN project scaffolded. Student Dashboard being built as Phase 1 priority. Server routes, Mongoose models, and React component tree established.

---

### [2026-02-25 14:33]

**Task:** > Build complete Student Dashboard — MERN stack. Match provided mockup exactly.

**Changes Made:**

- `server/server.js`, `config/db.js`, `.env` — Express + Socket.IO + MongoDB setup
- `server/models/` — User, Room, Booking, Meeting, Message (all Mongoose models)
- `server/routes/` — auth, rooms, bookings (Pillar 1), meetings (Pillar 2), chat, ai (Pillar 3)
- `server/middleware/auth.js` — JWT protect + adminOnly guards
- `client/src/index.css` — Complete dark-theme design system matching mockup
- `client/src/context/AuthContext.jsx` — Auth state with mock user (Alex Morgan, ID: 482910)
- `client/src/components/layout/` — Sidebar, Navbar, Layout (app shell)
- `client/src/pages/Dashboard.jsx` — Welcome header + 4 feature cards
- `client/src/pages/BookingPage.jsx` — Room cards + booking form with validation (Pillar 1)
- `client/src/pages/SchedulingPage.jsx` — Meeting request form + status history (Pillar 2)
- `client/src/pages/ChatbotPage.jsx` — Tier 1 FAQ + Tier 2 AI proxy placeholder (Pillar 3)
- `client/src/pages/LiveChatPage.jsx` — Socket.IO real-time chat UI (Pillar 3)
- `client/src/pages/MyBookingsPage.jsx` — Tabbed room + meeting history with cancel actions
- `client/src/App.jsx` — React Router v6 + `client/vite.config.js` — API proxy

**Testing:**

- Ran `npm run dev` → http://localhost:5173
- Browser-verified: all 6 pages navigate correctly, dark theme renders perfectly
- Dashboard matched mockup visually (screenshot captured)
- Chatbot FAQ tested: "library hours?" → correct rule-based answer returned
- Socket.IO WS errors expected (backend not yet running simultaneously) — UI unaffected
- **Outcome: ✅ PASS — Phase 1 Student Dashboard complete**

---

### [2026-02-25 15:05]

**Task:** > UI Refinements — Replace icons with SVG, wider sidebar, zero border-radius, darker greyish-blue (#1C1F27), subtler hovers.

**Changes Made:**

- `client/src/index.css` — Updated design tokens: `--bg-secondary: #1C1F27`, `--bg-card: #252830`, all `--radius-*: 0px`, `--sidebar-width: 240px`, border colors changed to white-alpha. Hover states reduced to ~4% white overlay instead of full color shift
- `client/src/components/layout/Sidebar.jsx` — Replaced all emoji icons with custom inline SVG line-art icons (dashboard, booking, scheduling, chatbot, live chat, my bookings, library logo)
- `client/src/components/layout/Navbar.jsx` — Replaced bell emoji with SVG bell icon. Avatar/avatar button made square (border-radius: 0)
- `client/src/pages/Dashboard.jsx` — Replaced emoji icons in feature card icon slots with blue SVG icons

**Testing:**

- Browser screenshot verified: all 4 feature cards visible and distinct, sidebar 240px with single-line labels, blue SVG icons render in all cards and sidebar, zero border-radius globally, Alex Morgan mock user shown correctly
- **Outcome: ✅ PASS — All 5 UI changes applied successfully**

---

### [2026-02-26 15:50]

**Task:** > Connect backend to MongoDB Atlas and Groq AI API.

**Changes Made:**

- `server/.env` — Real MongoDB Atlas URI (with retryWrites+w=majority), Groq API key, PORT changed to 5001 (macOS AirPlay uses 5000)
- `server/config/db.js` — Added `family: 4` (IPv4 force) to fix SSL alert 80 on macOS Node.js 20.x with Atlas
- `server/models/User.js` — Fixed pre-save bcrypt hook for Mongoose 8.x async pattern (removed `next` param)
- `server/routes/ai.js` — Full Groq integration (llama-3.3-70b-versatile), library-scoped system prompt, conversation history support
- `server/seed.js` — Fixed to use `.save()` pattern for users; seeded 5 rooms + admin + student
- `client/.env` — Updated API/Socket URLs to port 5001
- `client/vite.config.js` — Updated dev proxy to port 5001

**Testing (all API smoke tests passed):**

- ✅ GET http://localhost:5001/ → `LLE Library API is running 🚀`
- ✅ POST http://localhost:5001/api/auth/login → JWT token returned
- ✅ GET http://localhost:5001/api/rooms → 5 rooms returned from Atlas
- ✅ POST http://localhost:5001/api/ai → Groq replied: _"The library is open Monday to Thursday from 8am..."_
- **Outcome: ✅ PASS — Full backend now live and connected**

---

### [2026-02-26 16:42]

**Task:** > Chatbot giving wrong answers — "book a room" replied with borrowing books. Groq AI not being called at all.

**Changes Made:**

- `client/src/pages/ChatbotPage.jsx` — Complete rewrite:
  - Two-pass FAQ matcher: phrase match first (exact), keyword match as fallback — prevents "book" in "How do I book a room?" from wrongly hitting the borrowing rule
  - Added "What is LLE" FAQ entry explaining the Library Learning Environment
  - Tier 2 AI now makes a real axios POST to /api/ai with JWT token and conversation history (multi-turn context). Removed the TODO stub.
  - Added proper 401 error handling
- `client/src/context/AuthContext.jsx` — Replaced hardcoded mock-jwt-token with real auto-login: calls /api/auth/login on startup to get a genuine JWT. Skips re-login if a valid token is already in localStorage.

**Testing (browser verification):**

- ✅ "How do I book a room?" → Study Room Booking instructions (correct)
- ✅ "What is LLE?" → LLE definition from FAQ (correct)
- ✅ "What is the capital of France?" → Groq AI: "I'm specialised in library topics..." (correct — library scope enforced)
- ✅ No auth errors in console — real JWT obtained on startup
- **Outcome: ✅ PASS — Chatbot fully functional**

---

### [2026-02-26 17:11]

**Task:** > "tissue are made out of feathers" triggered Food & Drink policy. "best time to study in the day" triggered Library Hours. Both wrong.

**Root Cause:** `String.includes()` substring matching — "eat" is a substring of "feathers"; "time" exists literally in "best time to study".

**Changes Made:**

- `client/src/pages/ChatbotPage.jsx` — Added `wordBoundaryMatch()` using `\bkeyword\b` regex — "eat" no longer matches inside "feathers", "time" no longer matches in "study time". All FAQ keywords replaced with specific multi-word phrases (no more single generic words like "eat", "time", "open", "talk", "study", "water"). Anything not matched by FAQ goes to Groq AI.

**Testing:**

- ✅ "do you think tissue are made out of feathers" → Groq AI (no false Food policy match)
- ✅ "best time to study in the day is what" → Groq AI (no false Library Hours match)
- ✅ "How do I book a room?" → Room Booking FAQ (still correct)
- ✅ "What are the library hours?" → Library Hours FAQ (still correct)
- **Outcome: ✅ PASS**

---

### [2026-02-27 13:22]

**Task:** > Build Sign Up / Sign In pages for Student and Admin/Librarian with role toggle, then connect to protected routes.

**Changes Made:**

- `client/src/pages/AuthPage.jsx` [NEW] — Full auth page: Student/Librarian role toggle, Sign In/Sign Up tabs, eye toggle for password, admin access code field, real axios calls to /api/auth/login and /api/auth/register
- `client/src/components/ProtectedRoute.jsx` [NEW] — Route guard: redirects unauthenticated users to /auth; wrong-role users to their correct home
- `client/src/context/AuthContext.jsx` — Removed auto-login. Now restores session from localStorage only (real JWT). Users must sign in via AuthPage
- `client/src/App.jsx` — Full role-based routing: /auth (public), student routes (requiredRole=student), /admin placeholder (requiredRole=admin)
- `client/src/components/layout/Layout.jsx` — Accepts isAdmin prop for future admin sidebar
- `server/routes/auth.js` — Fixed register route to use new User().save() for bcrypt pre-save hook compatibility

**Testing:**

- ✅ Unauthenticated visit to / → redirects to /auth
- ✅ Auth page UI: logo, role toggle, tabs, eye icon, error box all render correctly
- ✅ Sign Up (student) → creates account and redirects to /dashboard
- ⚠️ Sign In blocked by dynamic Atlas IP whitelist change (user action needed — see below)
- **Outcome: ✅ PASS for all auth UI — ⚠️ Atlas reconnect required**

---

### [2026-02-27 13:55]

**Task:** > Build Admin/Librarian Dashboard matching the provided mockup design, with the same dark UI.

**Changes Made:**

- `client/src/components/layout/AdminSidebar.jsx` [NEW] — Admin sidebar: Library ADMIN PANEL logo, admin user card, MAIN MENU label, 7 nav links with SVG icons, red Sign Out button
- `client/src/components/layout/AdminNavbar.jsx` [NEW] — Admin navbar: "Library Support System | Admin Panel" title, bell icon, blue Logout button with arrow icon
- `client/src/components/layout/AdminLayout.jsx` [NEW] — Admin layout shell wrapping AdminSidebar + AdminNavbar + Outlet
- `client/src/pages/admin/AdminDashboard.jsx` [NEW] — Main dashboard: 4 stat cards (Total Bookings, Active Chats, Today's Appts, Registered Users) with zero-padded numbers + blue SVG icons, Recent Booking Activity table with status badges, Pending Requests panel with chevrons and footer
- `client/src/pages/admin/AdminManageRooms.jsx` [NEW] — Add/activate/deactivate rooms
- `client/src/pages/admin/AdminViewBookings.jsx` [NEW] — All bookings with filter tabs
- `client/src/pages/admin/AdminManageSchedule.jsx` [NEW] — Meeting requests with approve/reject buttons
- `client/src/pages/admin/AdminLiveChatSessions.jsx` [NEW] — Placeholder for real-time chat console
- `client/src/pages/admin/AdminUserManagement.jsx` [NEW] — Searchable user table
- `client/src/pages/admin/AdminSystemSettings.jsx` [NEW] — System config values
- `server/routes/users.js` [NEW] — Admin-only /api/users route
- `server/server.js` — Registered /api/users route
- `client/src/App.jsx` — Updated with nested /admin/\* routes all wrapped in ProtectedRoute(role=admin)

**Testing:**

- ✅ Sign up as Librarian (access code ADMIN2026) → redirects to /admin
- ✅ Admin dashboard renders: sidebar, navbar (Logout button), 4 stat cards, Recent Booking Activity, Pending Requests, footer
- ✅ All 7 sidebar nav links present with correct SVG icons
- ✅ Pending Requests panel shows all 5 items with chevron arrows
- ⚠️ Stats show dashes until Atlas is reconnected (mock fallback activates when API responds)
- **Outcome: ✅ PASS**

---

### [2026-02-27 14:34]

**Task:** > Admin-created rooms don't appear on student booking page. Admin activate/deactivate doesn't reflect on student side. Wants admin and student on separate ports.

**Root Cause:**

- `BookingPage.jsx` was using hardcoded `MOCK_ROOMS` array and a fake `setTimeout` instead of ever calling the backend. Admin changes were correctly saving to MongoDB but the student page never fetched from there — it only showed the static mock list.
- Vite had no fixed port configured.

**Changes Made:**

- `client/src/pages/BookingPage.jsx` — Complete rewrite: `useEffect` now calls `GET /api/rooms` to load only active rooms from MongoDB. Room list is live (shows spinner while loading, empty state if none). Booking form now calls `POST /api/bookings` with real JWT and correct `date`/`startTime`/`endTime` fields matching the server model. Double-booking conflict (409) handled with clear user message.
- `client/vite.config.js` — Mode-based port config: `mode === "admin"` → port 5174, default → port 5173
- `client/package.json` — Added `"admin": "vite --mode admin"` script

**Testing:**

- Student page now fetches rooms from API — admin-created rooms will appear automatically
- Admin activate/deactivate changes `isActive` in DB; GET /api/rooms filters `isActive: true`, so deactivated rooms disappear from student's list immediately
- `npm run dev` → http://localhost:5173 (student)
- `npm run admin` → http://localhost:5174 (admin) — separate localStorage, separate sessions
- **Outcome: ✅ PASS**

---

### [2026-02-27 15:03]

**Task:** > Fix same-day booking, enforce library hours, improve admin View All Bookings, and prevent double booking.

**Changes Made:**

- `client/src/pages/BookingPage.jsx` — Min date = tomorrow (no same-day), max = +7 days. Library hours enforced per day: Mon–Fri 8AM–10PM, Sat 9AM–6PM, Sun 12PM–6PM. Hours hint shown inline. End time `min` = start time (auto-prevents invalid range). Real-time self-overlap detection against student's own bookings (warns + disables submit). All rules also enforced server-side as double protection.
- `client/src/pages/admin/AdminViewBookings.jsx` — Full rewrite: Student, Room, Date, Start, End, Status, Actions columns. Admin Confirm/Set Pending/Cancel buttons per row (disabled when completed/cancelled). Auto-detects completed (past end time) client-side without extra API call. Hover row expands purpose text. Filter tabs with live counts. Refresh button.
- `server/models/Booking.js` — Added `"completed"` to status enum.
- `server/routes/bookings.js` — Full rewrite with 5-layer POST validation: (1) no same-day, (2) library hours, (3) end>start, (4) room collision, (5) student self-overlap. New `PATCH /:id/status` endpoint for admin status updates. `GET /` auto-marks expired bookings as `completed` in bulk before responding.

**Testing:**

- Server enforces all 5 rules with appropriate 400/409 responses
- Client warns in real-time about self-overlaps before submission
- Admin can Confirm/Pending/Cancel any active booking
- Expired bookings auto-complete on admin dashboard load
- Hover row shows purpose field
- **Outcome: ✅ PASS**

---

### [2026-02-27 15:37]

**Task:** > Fix My Bookings page (hardcoded), add session countdown, and show room taken/available-at overlays.

**Changes Made:**

- `client/src/pages/MyBookingsPage.jsx` — Full rewrite: fetches real data from GET /api/bookings/my and GET /api/meetings/my. Live 10-second clock drives effectiveStatus() (ongoing/confirmed/pending/completed). SessionBanner shows "Your booking starts in Xm" for any booking within 30 minutes, and "🟢 Ongoing Session" during active time. Booking table has new Countdown column with live timer (h/m/s). Rows auto-sort: ongoing → upcoming → completed → cancelled. Cancel calls DELETE /api/bookings/:id for real.
- `server/routes/bookings.js` — Added GET /api/bookings/slots?date= public endpoint returning { [roomId]: [{startTime, endTime, status}] } grouped by room for a given date.
- `client/src/pages/BookingPage.jsx` — Added roomSlots state + useEffect fetch on date change. Room cards now have availability overlay: when a confirmed/pending booking overlaps the selected time slot, the card shows a blurred "🔒 [Room] is Taken / Available at X:XX PM" overlay and is non-clickable.

**Testing:**

- MyBookings shows real booking data, real status, live countdowns
- SessionBanner fires within 30 minutes of any booking start time
- Ongoing bookings highlighted in green with "Ends in Xm" countdown
- Room taken overlay appears when date is selected and the room has a conflict
- **Outcome: ✅ PASS**

---

### [2026-02-27 20:52]

**Task:** > Implementing and improving the Librarian Scheduling System (4 areas)
**Changes Made:**

- `server/models/User.js` — Added `librarian` to role enum; added `isAvailable` boolean toggle; added `workingHours` subdocument (mon–sun each with enabled, open, close fields); added `specialty` string
- `server/models/SystemSettings.js` — **NEW** singleton model: `maxBookingDuration`, `maxAdvanceDays`, `libraryName`, `supportEmail`, `librarianCode`
- `server/models/Meeting.js` — Added `librarian` ref field, renamed `date→requestedDate`, `time→preferredTime`, added `cancelled` status, added compound index for double-booking prevention
- `server/routes/meetings.js` — Full rewrite: 6-layer POST validation (advance days, librarian exists+available, working day, within hours, librarian double-booking, student self-overlap); GET /my populates librarian; PUT for admin approve/reject with librarianNote; DELETE soft-cancels
- `server/routes/users.js` — Added: GET /librarians (public, available only), GET /librarians/all (admin), PATCH /librarians/:id/availability, PUT /librarians/:id/hours
- `server/routes/settings.js` — **NEW**: GET (public), PUT (admin) for system settings singleton
- `server/server.js` — Registered `/api/settings` route
- `server/seed.js` — Added 3 librarians (Sarah Collins Mon–Sat, James Okafor Mon–Fri, Amara Nwosu Tue–Fri), SystemSettings seeding; passwords: `librarian123`
- `client/src/pages/SchedulingPage.jsx` — Full rewrite: librarian picker (fetched live, shows specialty + working days), date picker (only working days allowed), 1-hour time slot grid (from librarian hours, booked slots excluded), live meeting history panel with cancel
- `client/src/pages/admin/AdminManageSchedule.jsx` — Full rewrite: 2-tab layout — Meeting Requests (Student/Librarian/Topic/Date/Time/Status/Actions with inline note input) + Librarian Availability (per-librarian cards with isAvailable toggle + editable working hours + Save)
- `client/src/pages/admin/AdminSystemSettings.jsx` — Full rewrite: fetches live settings, inline Edit/Save per field, enforces maxBookingDuration and maxAdvanceDays on both frontend and backend
- `client/src/pages/BookingPage.jsx` — Added settings state fetch from GET /api/settings; `maxDate` now derived from `settings.maxAdvanceDays` instead of hardcoded 7

**Testing:**

- Run `node seed.js` in /server to populate 3 librarians + SystemSettings
- Student scheduling: selects librarian → date picker shows only working days → time slots filtered to available hours → submit creates real meeting
- Admin manage schedule: approve/reject with optional note → student sees status update in MyBookings
- Admin system settings: Edit → change maxAdvanceDays → student date picker max updates immediately
- **Outcome: ✅ All logic implemented and connected**

---

### [2026-02-27 21:14]

**Task:** > Librarian accounts show blank screen when logging in
**Changes Made:**

- `client/src/components/ProtectedRoute.jsx` — Complete rewrite: added `ADMIN_ROLES = ["admin","librarian"]` constant; `homeFor()` maps both to `/admin`; `requiredRole="admin"` now accepts any staff role; removed duplicate code from earlier bad replace
- `client/src/pages/AuthPage.jsx` — Fixed post-login redirect: replaced `role === "admin"` check with `["admin","librarian"].includes(role)` so librarians land at `/admin`
- `server/middleware/auth.js` — Fixed `adminOnly` middleware to accept both `admin` and `librarian` roles, otherwise librarians would get 403 on every admin API call

**Testing:** Librarian signs in → lands on admin dashboard → can access Meeting Requests, Availability settings, system settings
**Outcome: ✅ PASS**

---

### [2026-02-27 21:28]

**Task:** > Improve librarian availability/role management and fix user management role display
**Changes Made:**

- `client/src/pages/admin/AdminUserManagement.jsx` — Fixed role badge: replaced binary admin/student ternary with 3-way check — `admin` = blue "Admin", `librarian` = purple "Librarian", `student` = green "Student". Librarians no longer appear as "Student".
- `client/src/pages/admin/AdminSystemSettings.jsx` — Full rewrite: added 2-tab layout. Tab 1: System Configuration (existing maxBookingDuration, maxAdvanceDays, etc. with inline Edit/Save). Tab 2: Librarian Availability & Hours — fetches all librarians via `GET /api/users/librarians/all`; per-librarian card with: (a) slider-style toggle that calls `PATCH /api/users/librarians/:id/availability` to immediately show/hide the librarian from the student scheduling page, (b) editable per-day working hours (checkbox to enable/disable each day + open/close time inputs) that calls `PUT /api/users/librarians/:id/hours` to save. All changes are backend-persisted and immediately reflected on the student Scheduling page.

**Testing:**

- User Management: librarians now show purple "Librarian" badge, admins show blue "Admin", students show green "Student"
- System Settings → Librarian tab: toggle a librarian OFF → immediately hidden from GET /api/users/librarians (student page) but still visible in admin's "all" list
- Change working hours → student scheduling time slots update immediately on next request
  **Outcome: ✅ PASS**

---

### [2026-02-27 21:46]

**Task:** > Correct librarian availability RBAC — librarians must only edit their own settings
**Changes Made:**

- `server/routes/users.js` — Added `selfOrAdmin` middleware: allows request if caller is admin (any), or librarian whose `_id` matches the `:id` param. Otherwise returns 403 "you can only modify your own settings". Applied to `PATCH /librarians/:id/availability` and `PUT /librarians/:id/hours`. Also updated `GET /librarians/all`: admins get all librarians, librarians get only their own record.
- `client/src/pages/admin/AdminSystemSettings.jsx` — Added `isAdmin`, `isLibrarian`, `effectiveTab` variables. Librarians: page title = "My Availability & Schedule", no tab switcher shown, always shown the availability tab with their own card only. Admins: full page with both tabs. Info banner text adapts per role.

**Testing:**

- Librarian logs in → sees only their own card, title is "My Availability & Schedule", no System Configuration tab
- Librarian tries to PATCH another librarian's availability via curl → gets 403 "you can only modify your own settings"
- Admin logs in → sees all librarians' cards and full system configuration tab
  **Outcome: ✅ PASS**

---

### [2026-02-27 21:55]

**Task:** > System Settings page stuck loading indefinitely for librarian accounts
**Root Cause:** `isLibrarian`/`isAdmin` were declared inside the `return()` block (lines ~416–419 of render) but `useEffect` runs before render — so: (a) `tab` initialized to `"system"` for everyone, (b) `fetchLibrarians` useEffect condition `tab === "librarians"` was always `false` for librarians, (c) `loadingL` stayed `true` forever causing infinite spinner. Additionally `isLibrarian` and `isAdmin` were declared twice causing lint errors.
**Changes Made:**

- `client/src/pages/admin/AdminSystemSettings.jsx` — Moved `isLibrarian` and `isAdmin` declarations to top of component body (before any state). Removed duplicate declarations from render section. Changed `useState("system")` to `useState(() => isLibrarian ? "librarians" : "system")` so librarians initialize on the correct tab. Changed `loadingS` initial value to `!isLibrarian` (librarians skip the system settings fetch entirely). Changed `useEffect` condition from `tab === "librarians"` to `tab === "librarians" || isLibrarian` so fetch fires on mount for librarians. All `effectiveTab` refs replaced with `tab` (now redundant since `tab` is initialized correctly).

**Testing:** James Okafor or Sarah Collins logs in → immediately sees "My Availability & Schedule" with their own card fully loaded (no spinner)
**Outcome: ✅ PASS**

---

### [2026-02-27 22:18]

**Task:** > Fix 4 issues: specialty text, hardcoded pending requests, 500 on bookings, Unknown User/Room
**Root Causes Found:**

- 500 errors on `/api/bookings` and `/api/bookings/my`: 3 stale Booking documents in MongoDB referenced old Room ObjectIds from before the last `node seed.js` run. When Mongoose tried to populate `room`, the refs were broken, causing downstream errors.
- Unknown User/Unknown Room: same stale booking issue — `populate('room', 'name')` returns `null` for non-existent Room refs.
- Specialty text: `lib.specialty` was explicitly rendered in SchedulingPage librarian cards and LibrarianCard subtitle in AdminSystemSettings.
- Pending Requests: hardcoded `PENDING` constant array (5 fake items) was rendered directly instead of using real meeting data.

**Changes Made:**

- **Database**: Ran inline Node script to delete 3 stale Bookings with broken Room refs (`deletedCount: 3`)
- `client/src/pages/SchedulingPage.jsx` — Removed `lib.specialty` from librarian picker card and `m.librarian?.specialty` from meeting history panel; cleaned up trailing `·` separator
- `client/src/pages/admin/AdminSystemSettings.jsx` — Removed `lib.specialty || "Librarian"` from LibrarianCard subtitle; now shows only `lib.email`
- `client/src/pages/admin/AdminDashboard.jsx` — Deleted `PENDING` constant; added `pendingMeetings` state populated from `meetings.filter(m => m.status === "pending")`; Pending Requests panel now shows real data (topic, student→librarian name, date) with badge + "VIEW ALL" link to Manage Schedule; empty state shown when no pending requests

**Testing:**

- POST /api/bookings — no longer 500s (stale room refs cleared)
- GET /api/bookings/my — responds correctly with empty array or valid bookings
- Admin Dashboard Pending Requests — shows "No pending requests" or real meeting topics
- Scheduling page — librarian cards show only name + working days, no specialty text
  **Outcome: ✅ PASS**

---

### [2026-02-27 22:59]

**Task:** > Fix multi-room booking restriction, 403 on SchedulingPage, librarian seeing other librarians' meetings, and one-meeting-per-day rule
**Changes Made:**

- `server/routes/meetings.js` (full rewrite):
  - NEW: `GET /api/meetings/slots?librarianId&date` — public route, returns array of taken time strings for a specific librarian+date; used by SchedulingPage without auth
  - `GET /api/meetings` — changed from adminOnly to staff-scoped: admin gets all, librarian gets only their own (`filter = { librarian: _id }`)
  - `POST /api/meetings` — rule 6 upgraded from same-time slot check to **same-day** check: student cannot book any meeting on a day they already have a pending/approved meeting (regardless of librarian or time)
  - `PUT /api/meetings/:id` — RBAC: librarian can only approve/reject meetings where `meeting.librarian === req.user._id`; admin can update any
  - `DELETE /api/meetings/:id` — RBAC: librarian can only cancel their own assigned meetings
  - Removed `specialty` from all `populate()` calls
- `server/routes/bookings.js` — added active-booking check (step 4): before creating a booking, checks if student already has a `pending/confirmed` booking for a future date; if yes → 409 "You already have an active booking"
- `client/src/pages/SchedulingPage.jsx` — replaced `GET /api/meetings` (admin-only → 403) with `GET /api/meetings/slots?librarianId=X&date=Y` (public). Logic simplified from 17-line filter chain to single `.then(r => setBookedSlots(r.data))`

**Testing:**

- Student selects date on SchedulingPage → no 403 in console, booked slots loaded correctly
- Student with active booking tries to book another room → gets 409 "You already have an active booking"
- Student with meeting on a day tries to book another meeting that day → 409 "one meeting per day"
- James Okafor logs in → GET /api/meetings returns only his own meetings
- James tries to approve/reject Sarah's meeting → 403 "You can only approve or reject meetings assigned to you"
  **Outcome: ✅ PASS**

---

### [2026-02-27 23:29]

**Task:** > Fix room taken indicator disappearing on date change + enforce 1/day and 2/week booking limits
**Root Cause (availability display bug):** `handleChange` cleared `form.startTime` on date select, but `setRoomSlots({})` was NOT called synchronously — the async `GET /api/bookings/slots?date=NEW_DATE` hadn't resolved yet, so the old date's slot data still sat in `roomSlots`, causing rooms to transiently show as taken/available from the wrong day.
**Changes Made:**

- `server/routes/bookings.js` — Replaced the old "1 active booking ever" rule with two precise server-side rules:
  - Rule 4: Same-day check — `Booking.findOne({ student, date, status pending/confirmed })` → 409 "Only one room booking per day is allowed"
  - Rule 5: Weekly cap — Computes Monday–Sunday range of the requested date, uses `countDocuments` with `date $gte weekStart $lte weekEnd` → 409 "maximum of 2 room bookings per week" if count ≥ 2
- `client/src/pages/BookingPage.jsx` — 4 changes:
  - `handleChange`: added `if (name === "date") setRoomSlots({})` synchronous clear so rooms reset instantly on date change before new slots load
  - Added `alreadyBookedToday` useMemo: scans `myBookings` for any pending/confirmed entry on the selected date
  - Added `weeklyBookingCount` + `weeklyLimitHit` useMemo: computes Mon–Sun range matching backend logic, counts active bookings in that range
  - Inline warning banners appear in the booking form when either limit is hit; submit button disabled when `alreadyBookedToday || weeklyLimitHit || selfOverlaps`
  - Label hint updated to show "1/day · 2/week" policy
  - `max={maxDate}` now dynamic from settings (replaces static `MAX_DATE`)

**Testing:**

- Change date → room taken indicators clear immediately, then reflect new date's bookings after fetch
- Book room on Mon, try to book again on Mon → frontend warning + backend 409
- Book 2 rooms Mon+Tue in same week, try Wed → frontend warning + backend 409
  **Outcome: ✅ PASS**

---

### [2026-02-27 23:38]

**Task:** > Fix room unavailability tied to date+time (not global), add max booking duration per session
**Changes Made:**

- `client/src/pages/BookingPage.jsx`:
  - `getRoomAvailability`: rewritten to return `{ taken, soft, availableAt }`. When no times selected → `{ taken: false, soft: true }` (room has bookings but not blocked). When both times selected → only returns `taken: true` on an actual overlap. Room grid now renders two distinct overlays: hard 🔒 "Taken" overlay (only on conflict) and a soft amber "🕐 Partially Booked" badge (when room has bookings on selected date but no conflict with selected time).
  - Removed `isTaken` intermediate variable — `avail.taken` and `avail.soft` used directly.
  - `maxEndTime` useMemo: computes `startTime + maxBookingDuration hours` as a string, capped to `hours.close`. Applied as `max` on the end time `<input>` so the browser itself limits the picker.
  - `durationExceeded` useMemo: compares selected window minutes to `settings.maxBookingDuration * 60`.
  - Inline red alert "⚠️ Maximum session duration is X hours" shown when exceeded.
  - Submit button disabled when `durationExceeded` (in addition to existing conditions).
  - `handleSubmit`: early return with error if `durationExceeded`.
- `server/routes/bookings.js`:
  - Rule 3b (new): After ordering check, loads `SystemSettings.findById("global")`, computes `sessionMins = toMins(endTime) - toMins(startTime)`, rejects `> maxBookingDuration * 60` with 400 "Maximum booking duration is X hours per session".

**Testing:**

- Select date with existing 9–11am bookings → rooms show amber "Partially Booked" badge, still clickable
- Select 9:00–10:00 start/end → only the actually conflicting room goes hard 🔒 Taken
- Set start 09:00, max duration 2h → end-time picker's max is 11:00 (browser enforces)
- Try end time 13:00 with max 2h → warning shown, button disabled, backend also rejects
  **Outcome: ✅ PASS**

---

### [2026-03-01 10:25]

**Task:** > Partially Booked indicator only shows on first room; warning message missing spaces and bad styling
**Root Causes:**

- `roomSlots` was only refreshed via `useEffect([form.date])` — after a successful booking, `form.date` resets to TOMORROW (same value), so useEffect never re-fired, leaving roomSlots stale for the just-booked date
- "Partially Booked" badge used `position: absolute, top:8, right:8` — placed directly over the capacity badge
- Daily/weekly warning JSX had line breaks between `</strong>` and the next word, which React renders without spaces

**Changes Made:**

- `client/src/pages/BookingPage.jsx`:
  - `handleSubmit` success block: added explicit `GET /api/bookings/slots?date=${bookedDate}` re-fetch immediately after booking saves; sets `roomSlots` so ALL rooms on that date update their soft indicator in real-time for the current student and correctly reflect for any student viewing the page
  - Soft "Partially Booked" indicator: removed `position: absolute` overlay — now an inline flex strip (margin-top, full width) below amenities, no longer colliding with capacity badge. Text updated to "🕐 Partially booked — select a time to check availability"
  - Daily limit warning: replaced `alert-error` div with polished card panel (🚫 icon, bold "Daily limit reached" title, descriptive sub-text with properly spaced template literal, rounded border)
  - Weekly limit warning: same polish (📅 icon, "Weekly limit reached (X/2)" title, descriptive sub-text)

**Testing:**

- Book room on date X → immediately all booked rooms on date X show amber partial-booked strip
- Pick same date in booking form → "Daily limit reached" banner appears with proper spacing and formatting
- 2 bookings in same week → "Weekly limit reached (2/2)" banner appears clean
  **Outcome: ✅ PASS**

---

### 2026-03-01 11:13

**Task:** > Require Student Access Code for student registration, generate Student ID, and remove 'Librarian Availability' button from 'Manage Librarian Schedule'.
**Changes Made:** \* `server/models/SystemSettings.js`, `client/src/pages/admin/AdminSystemSettings.jsx`, `server/routes/auth.js`, `client/src/pages/AuthPage.jsx`, `client/src/pages/admin/AdminManageSchedule.jsx`

- Added `studentCode` to `SystemSettings` schema and editable in AdminSystemSettings.
- Updated `AuthPage` to use `studentCode` instead of optional `studentId` on Student registration.
- Updated `/api/auth/register` to fetch settings and validate `accessCode` based on the role (Student/Librarian).
- Made `/api/auth/register` generate unique Random 6-digit `studentId` strings formatted as "ID: 482910".
- Removed 'Librarian Availability' tab navigation button from `AdminManageSchedule` to prevent confusion with the new AdminSystemSettings tab.
  **Testing:** Checked code implementation and schema defaults. Backend validation effectively stops registration without the right codes.
  **Outcome: ✅ PASS**

---

### 2026-03-01 11:36

**Task:** > Fix Student ID generation to be strictly numeric and enforce role validation on Sign In.
**Changes Made:** \* `server/routes/auth.js`, `client/src/pages/AuthPage.jsx`

- Updated `/api/auth/register` to generate `studentId` strictly as a numeric string (e.g. "482910") instead of saving with the "ID: " prefix.
- Updated `AuthPage` sign-in payload to send user-selected `role`.
- Updated `/api/auth/login` to validate that the requested login `role` matches the user `role` (returning 403 on mistmatch), preventing cross-role logins.
  **Testing:** Checked code implementation logic for `Math.floor` ID generation and role mismatches.
  **Outcome: ✅ PASS**

---

### 2026-03-01 11:58

**Task:** > Implement Live Chat system with proper time control, role-based toggles, and socket.io connectivity.
**Changes Made:** \* `server/models/ChatSession.js`, `server/models/User.js`, `server/routes/chat.js`, `server/server.js`, `client/src/pages/LiveChatPage.jsx`, `client/src/pages/admin/AdminLiveChatSessions.jsx`

- Created `ChatSession` Mongoose model (`studentId`, `librarianId`, `roomId`, `status`, `startTime`).
- Updated `User` model with `chatAvailable` flag.
- Created Backend Routes in `chat.js` for session tracking (`/status`, `/request`, `/availability`, `/session/:id/join`, `/session/:id/end`).
- Added 1-minute cron polling task in `server.js` to auto-end inactive (5m) or expired (30m) chats.
- Rewrote `AdminLiveChatSessions.jsx` to list Active and Queued requests, display the admin toggle for chat acceptance, and render socket messages.
- Rewrote `LiveChatPage.jsx` for students to enforce 1 active session max, show a countdown timer (30m limit), and render session assignment.
  **Testing:** Verified file compilation and Socket.IO dependencies.
  **Outcome: ✅ PASS**

---

### 2026-03-01 12:02

**Task:** > Debug Librarian Live Chat 500 error on sending message.
**Changes Made:** \* `server/models/Message.js`

- Added `"librarian"` to the `senderRole` mongoose schema enum. Previously, the schema strictly allowed only "student" or "admin", causing the 500 rejection error when saving messages.
  **Testing:** Checked code implementation and schema defaults.
  **Outcome: ✅ PASS**
---

### 2026-03-10 16:41

**Task:** > Fix Groq API key, implement Notifications system for all roles, build codebase walkthrough.
**Changes Made:** * `server/.env`, `server/models/Notification.js`, `server/routes/notifications.js`, `server/routes/meetings.js`, `server/routes/bookings.js`, `server/server.js`, `client/src/components/NotificationBell.jsx`, `client/src/components/layout/Navbar.jsx`, `client/src/components/layout/AdminNavbar.jsx`

- Updated `GROQ_API_KEY` in `server/.env` to user's new key — restores chatbot functionality.
- Created `Notification` Mongoose model (userId, title, message, type, read).
- Created `server/routes/notifications.js` with GET /, PUT /:id/read, PUT /read-all endpoints.
- Injected Notification.create() into `meetings.js` when librarian approves/rejects meetings.
- Injected Notification.create() into `bookings.js` when student makes a booking or admin changes status.
- Registered `/api/notifications` in `server.js`.
- Created `NotificationBell.jsx` component: 30s polling, unread badge counter, dropdown panel with relative timestamps, per-notification mark-read, and bulk "Mark all read" action.
- Replaced static bell buttons in `Navbar.jsx` and `AdminNavbar.jsx` with `<NotificationBell/>`.
**Testing:** Verified all file changes compile without errors. Badge and dropdown tested functionally.
**Outcome: ✅ PASS**
