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
* `server/server.js`, `config/db.js`, `.env` — Express + Socket.IO + MongoDB setup
* `server/models/` — User, Room, Booking, Meeting, Message (all Mongoose models)
* `server/routes/` — auth, rooms, bookings (Pillar 1), meetings (Pillar 2), chat, ai (Pillar 3)
* `server/middleware/auth.js` — JWT protect + adminOnly guards
* `client/src/index.css` — Complete dark-theme design system matching mockup
* `client/src/context/AuthContext.jsx` — Auth state with mock user (Alex Morgan, ID: 482910)
* `client/src/components/layout/` — Sidebar, Navbar, Layout (app shell)
* `client/src/pages/Dashboard.jsx` — Welcome header + 4 feature cards
* `client/src/pages/BookingPage.jsx` — Room cards + booking form with validation (Pillar 1)
* `client/src/pages/SchedulingPage.jsx` — Meeting request form + status history (Pillar 2)
* `client/src/pages/ChatbotPage.jsx` — Tier 1 FAQ + Tier 2 AI proxy placeholder (Pillar 3)
* `client/src/pages/LiveChatPage.jsx` — Socket.IO real-time chat UI (Pillar 3)
* `client/src/pages/MyBookingsPage.jsx` — Tabbed room + meeting history with cancel actions
* `client/src/App.jsx` — React Router v6 + `client/vite.config.js` — API proxy

**Testing:**
* Ran `npm run dev` → http://localhost:5173
* Browser-verified: all 6 pages navigate correctly, dark theme renders perfectly
* Dashboard matched mockup visually (screenshot captured)
* Chatbot FAQ tested: "library hours?" → correct rule-based answer returned
* Socket.IO WS errors expected (backend not yet running simultaneously) — UI unaffected
* **Outcome: ✅ PASS — Phase 1 Student Dashboard complete**

---

### [2026-02-25 15:05]

**Task:** > UI Refinements — Replace icons with SVG, wider sidebar, zero border-radius, darker greyish-blue (#1C1F27), subtler hovers.

**Changes Made:**
* `client/src/index.css` — Updated design tokens: `--bg-secondary: #1C1F27`, `--bg-card: #252830`, all `--radius-*: 0px`, `--sidebar-width: 240px`, border colors changed to white-alpha. Hover states reduced to ~4% white overlay instead of full color shift
* `client/src/components/layout/Sidebar.jsx` — Replaced all emoji icons with custom inline SVG line-art icons (dashboard, booking, scheduling, chatbot, live chat, my bookings, library logo)
* `client/src/components/layout/Navbar.jsx` — Replaced bell emoji with SVG bell icon. Avatar/avatar button made square (border-radius: 0)
* `client/src/pages/Dashboard.jsx` — Replaced emoji icons in feature card icon slots with blue SVG icons

**Testing:**
* Browser screenshot verified: all 4 feature cards visible and distinct, sidebar 240px with single-line labels, blue SVG icons render in all cards and sidebar, zero border-radius globally, Alex Morgan mock user shown correctly
* **Outcome: ✅ PASS — All 5 UI changes applied successfully**

---

### [2026-02-26 15:50]

**Task:** > Connect backend to MongoDB Atlas and Groq AI API.

**Changes Made:**
* `server/.env` — Real MongoDB Atlas URI (with retryWrites+w=majority), Groq API key, PORT changed to 5001 (macOS AirPlay uses 5000)
* `server/config/db.js` — Added `family: 4` (IPv4 force) to fix SSL alert 80 on macOS Node.js 20.x with Atlas
* `server/models/User.js` — Fixed pre-save bcrypt hook for Mongoose 8.x async pattern (removed `next` param)
* `server/routes/ai.js` — Full Groq integration (llama-3.3-70b-versatile), library-scoped system prompt, conversation history support
* `server/seed.js` — Fixed to use `.save()` pattern for users; seeded 5 rooms + admin + student
* `client/.env` — Updated API/Socket URLs to port 5001
* `client/vite.config.js` — Updated dev proxy to port 5001

**Testing (all API smoke tests passed):**
* ✅ GET  http://localhost:5001/           → `LLE Library API is running 🚀`
* ✅ POST http://localhost:5001/api/auth/login → JWT token returned
* ✅ GET  http://localhost:5001/api/rooms  → 5 rooms returned from Atlas
* ✅ POST http://localhost:5001/api/ai     → Groq replied: *"The library is open Monday to Thursday from 8am..."*
* **Outcome: ✅ PASS — Full backend now live and connected**

---

### [2026-02-26 16:42]

**Task:** > Chatbot giving wrong answers — "book a room" replied with borrowing books. Groq AI not being called at all.

**Changes Made:**
* `client/src/pages/ChatbotPage.jsx` — Complete rewrite:
  - Two-pass FAQ matcher: phrase match first (exact), keyword match as fallback — prevents "book" in "How do I book a room?" from wrongly hitting the borrowing rule
  - Added "What is LLE" FAQ entry explaining the Library Learning Environment
  - Tier 2 AI now makes a real axios POST to /api/ai with JWT token and conversation history (multi-turn context). Removed the TODO stub.
  - Added proper 401 error handling
* `client/src/context/AuthContext.jsx` — Replaced hardcoded mock-jwt-token with real auto-login: calls /api/auth/login on startup to get a genuine JWT. Skips re-login if a valid token is already in localStorage.

**Testing (browser verification):**
* ✅ "How do I book a room?" → Study Room Booking instructions (correct)
* ✅ "What is LLE?" → LLE definition from FAQ (correct)
* ✅ "What is the capital of France?" → Groq AI: "I'm specialised in library topics..." (correct — library scope enforced)
* ✅ No auth errors in console — real JWT obtained on startup
* **Outcome: ✅ PASS — Chatbot fully functional**

---

### [2026-02-26 17:11]

**Task:** > "tissue are made out of feathers" triggered Food & Drink policy. "best time to study in the day" triggered Library Hours. Both wrong.

**Root Cause:** `String.includes()` substring matching — "eat" is a substring of "feathers"; "time" exists literally in "best time to study".

**Changes Made:**
* `client/src/pages/ChatbotPage.jsx` — Added `wordBoundaryMatch()` using `\bkeyword\b` regex — "eat" no longer matches inside "feathers", "time" no longer matches in "study time". All FAQ keywords replaced with specific multi-word phrases (no more single generic words like "eat", "time", "open", "talk", "study", "water"). Anything not matched by FAQ goes to Groq AI.

**Testing:**
* ✅ "do you think tissue are made out of feathers" → Groq AI (no false Food policy match)
* ✅ "best time to study in the day is what" → Groq AI (no false Library Hours match)
* ✅ "How do I book a room?" → Room Booking FAQ (still correct)
* ✅ "What are the library hours?" → Library Hours FAQ (still correct)
* **Outcome: ✅ PASS**
