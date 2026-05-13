# 📚 LLE Library Support System

The **LLE Library Support System** is a full-stack web application designed for university libraries. It provides students with core services such as study room booking, librarian scheduling, and a hybrid AI/live chat support system. It also features a comprehensive Admin/Librarian management panel.

## 🚀 Features

### 1️⃣ Room Booking System
Students can reserve study rooms and spaces. The system enforces business rules such as library hours, maximum advance days, daily/weekly limits, and prevents double bookings.

### 2️⃣ Meeting Scheduling
Students can book meetings with librarians based on their specific availability and working hours. Librarians can manage their own schedules, approve, or reject meeting requests.

### 3️⃣ Hybrid Support Chatbot
A tiered chat system:
- **Tier 1**: Rule-based FAQ matcher for instant answers to common questions.
- **Tier 2**: AI Chatbot powered by the Groq API (LLaMA 3) restricted to library-specific knowledge.
- **Tier 3**: Real-time Live Chat via Socket.IO with available librarians.

## 💻 Tech Stack

### Frontend
- **React 18** (with Vite)
- **React Router v6** for SPA navigation
- **Axios** for HTTP requests
- **Socket.IO Client** for real-time live chat
- **Vanilla CSS** with a custom dark-theme design system

### Backend
- **Node.js & Express.js**
- **MongoDB** & **Mongoose** for data persistence
- **Socket.IO** for real-time WebSocket communication
- **Groq SDK** for the AI assistant
- **JWT & bcryptjs** for secure role-based authentication

## 📸 Screenshots

### 1. Room Booking Page (`/booking`)
> Highlights the room selection and the time slot validation rules.
![Room Booking](./screenshots/Study%20Room%20Booking.png)

### 2. Librarian Scheduling (`/scheduling`)
> Shows the date and time picker for booking meetings.
![Scheduling](./screenshots/Librarian%20Scheduling.png)

### 3. Live Chat Sessions (`/livechat`)
> Real-time hybrid AI and Live Chat support interface.
![Live Chat](./screenshots/Live%20Chat%20Seesions.png)

### 4. Admin Dashboard (`/admin`)
> Highlights the management interface, stats, and pending requests.
![Admin Dashboard](./screenshots/Admin%20Dashboard.png)

## 🛠️ Environment Variables

To run this project, you will need to add the following environment variables.

### Backend (`/server/.env`)
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AI_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:5173
```

### Frontend (`/client/.env`)
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

## 🏃‍♂️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/lle-library-support.git
cd lle-library-support
```

### 2. Install dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Seed the database (Optional)
```bash
cd server
npm run seed
```

### 4. Run the application
Start the backend server (runs on port 5001):
```bash
cd server
npm run dev
```

Start the student frontend (runs on port 5173):
```bash
cd client
npm run dev
```

Start the admin frontend (runs on port 5174):
```bash
cd client
npm run admin
```

## 👥 Roles & Access
- **Student**: Default registration.
- **Librarian / Admin**: Requires a system access code during registration.

---
*Created as part of the LLE Library Support System project.*
