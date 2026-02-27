import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Layouts
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";

// Auth
import AuthPage from "./pages/AuthPage";

// Student pages
import Dashboard from "./pages/Dashboard";
import BookingPage from "./pages/BookingPage";
import SchedulingPage from "./pages/SchedulingPage";
import ChatbotPage from "./pages/ChatbotPage";
import LiveChatPage from "./pages/LiveChatPage";
import MyBookingsPage from "./pages/MyBookingsPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminManageRooms from "./pages/admin/AdminManageRooms";
import AdminViewBookings from "./pages/admin/AdminViewBookings";
import AdminManageSchedule from "./pages/admin/AdminManageSchedule";
import AdminLiveChatSessions from "./pages/admin/AdminLiveChatSessions";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/auth" element={<AuthPage />} />

        {/* ── Student Routes (role = student) ── */}
        <Route
          path="/"
          element={
            <ProtectedRoute requiredRole="student">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="scheduling" element={<SchedulingPage />} />
          <Route path="chatbot" element={<ChatbotPage />} />
          <Route path="livechat" element={<LiveChatPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
        </Route>

        {/* ── Admin Routes (role = admin) ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="rooms" element={<AdminManageRooms />} />
          <Route path="bookings" element={<AdminViewBookings />} />
          <Route path="schedule" element={<AdminManageSchedule />} />
          <Route path="livechat" element={<AdminLiveChatSessions />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="settings" element={<AdminSystemSettings />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
