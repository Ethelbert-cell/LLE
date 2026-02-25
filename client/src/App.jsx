import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
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
        {/* Student App */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="scheduling" element={<SchedulingPage />} />
          <Route path="chatbot" element={<ChatbotPage />} />
          <Route path="livechat" element={<LiveChatPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
