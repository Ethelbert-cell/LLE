import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import BookingPage from "./pages/BookingPage";
import SchedulingPage from "./pages/SchedulingPage";
import ChatbotPage from "./pages/ChatbotPage";
import LiveChatPage from "./pages/LiveChatPage";
import MyBookingsPage from "./pages/MyBookingsPage";

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/auth" element={<AuthPage />} />

        {/* ── Student Dashboard (protected, role=student) ── */}
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

        {/* ── Admin Dashboard (protected, role=admin) ── */}
        {/* Placeholder — full admin layout added in next phase */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout isAdmin />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all → auth ── */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
