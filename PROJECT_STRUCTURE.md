# 📚 LLE Library Support System — Project Structure

> **MERN Stack** | MongoDB · Express · React · Node.js  
> **Last Updated:** 2026-02-25  
> **Status:** 🟡 In Development — Phase 1: Student Dashboard

---

## Overview

The **LLE Library Support System** is a full-stack web application for a university library. It provides students with three core services and gives administrators (librarians) a management panel.

### Three Feature Pillars

| #   | Pillar         | Description                                                             |
| --- | -------------- | ----------------------------------------------------------------------- |
| 1️⃣  | **Booking**    | Students reserve study rooms/spaces; admins manage inventory            |
| 2️⃣  | **Scheduling** | Students book meetings with librarians; admins approve/reject           |
| 3️⃣  | **Chat**       | Hybrid: Rule-based FAQs (Tier 1) + AI/NLP (Tier 2) + Live chat (Tier 3) |

---

## Directory Tree

```
LLE/
├── client/                          # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Images, icons
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx      # Left navigation panel
│   │   │   │   ├── Navbar.jsx       # Top bar (notification + avatar)
│   │   │   │   └── Layout.jsx       # App shell wrapper
│   │   │   ├── booking/
│   │   │   │   ├── RoomCard.jsx     # Individual room display card
│   │   │   │   └── BookingForm.jsx  # Room reservation form
│   │   │   ├── scheduling/
│   │   │   │   └── MeetingForm.jsx  # Meeting request form
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.jsx   # Chatbot message UI
│   │   │   │   └── LiveChatWindow.jsx # Socket.IO live chat UI
│   │   │   └── ui/
│   │   │       ├── FeatureCard.jsx  # Dashboard feature cards
│   │   │       └── StatusBadge.jsx  # Pending/Approved/Rejected badge
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # /dashboard — home overview
│   │   │   ├── BookingPage.jsx      # /booking — room booking (Pillar 1)
│   │   │   ├── SchedulingPage.jsx   # /scheduling — meetings (Pillar 2)
│   │   │   ├── ChatbotPage.jsx      # /chatbot — AI chat (Pillar 3 T1+T2)
│   │   │   ├── LiveChatPage.jsx     # /livechat — live chat (Pillar 3 T3)
│   │   │   ├── MyBookingsPage.jsx   # /my-bookings — student's history
│   │   │   └── LoginPage.jsx        # /login — authentication
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # JWT auth state (user, token)
│   │   ├── services/
│   │   │   └── api.js               # Axios instance + API helpers
│   │   ├── App.jsx                  # Routes configuration
│   │   ├── main.jsx                 # Vite entry point
│   │   └── index.css                # Global design system (dark theme)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js + Express backend
│   ├── config/
│   │   └── db.js                    # MongoDB/Mongoose connection
│   ├── models/
│   │   ├── User.js                  # Students & admin accounts
│   │   ├── Room.js                  # Library spaces/rooms
│   │   ├── Booking.js               # Room reservations
│   │   ├── Meeting.js               # Librarian meeting requests
│   │   └── Message.js               # Live chat messages
│   ├── routes/
│   │   ├── auth.js                  # POST /api/auth/register, /login
│   │   ├── rooms.js                 # GET /api/rooms (room listing)
│   │   ├── bookings.js              # CRUD /api/bookings
│   │   ├── meetings.js              # CRUD /api/meetings
│   │   ├── chat.js                  # GET /api/chat/history
│   │   └── ai.js                    # POST /api/ai (NLP proxy)
│   ├── middleware/
│   │   └── auth.js                  # JWT verification middleware
│   ├── .env                         # Environment variables (gitignored)
│   ├── package.json
│   └── server.js                    # Express app entry point
│
├── project_log.md                   # 📋 Audit log (always updated)
├── PROJECT_STRUCTURE.md             # 📄 This file
└── README.md                        # Project overview
```

---

## Tech Stack

| Layer       | Technology               | Purpose               |
| ----------- | ------------------------ | --------------------- |
| Frontend    | React 18 + Vite          | Student & Admin UI    |
| Routing     | React Router v6          | SPA navigation        |
| HTTP Client | Axios                    | API calls             |
| Real-time   | Socket.IO                | Live chat             |
| State       | React Context            | Auth state            |
| Backend     | Node.js + Express        | REST API server       |
| Database    | MongoDB + Mongoose       | Data persistence      |
| Auth        | JWT + bcrypt             | Secure authentication |
| AI/NLP      | Gemini API (placeholder) | Chatbot Tier 2        |
| Styling     | Vanilla CSS              | Custom dark theme     |

---

## Environment Variables

### `/server/.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/lle_library
JWT_SECRET=your_jwt_secret_here
AI_API_KEY=your_gemini_or_openai_key_here
CLIENT_URL=http://localhost:5173
```

### `/client/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Development Commands

```bash
# Start backend (from /server)
npm run dev

# Start frontend (from /client)
npm run dev

# Both together (from root, if concurrently installed)
npm run dev
```

---

## Changelog

| Date       | Phase | What Changed                                |
| ---------- | ----- | ------------------------------------------- |
| 2026-02-25 | 0     | Project initialized — MERN scaffold created |

---

> 📌 **Note for developers:** Always update `project_log.md` after any changes. Feature code must be isolated to its respective pillar as per architecture rules.
