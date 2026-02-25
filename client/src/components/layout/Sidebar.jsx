import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "⊞" },
  { path: "/booking", label: "Study Room Booking", icon: "🚪" },
  { path: "/scheduling", label: "Librarian Scheduling", icon: "🗓" },
  { path: "/chatbot", label: "Chatbot Assistance", icon: "🤖" },
  { path: "/livechat", label: "Live Chat", icon: "💬" },
  { path: "/my-bookings", label: "My Bookings", icon: "📋" },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📚</div>
        <div className="sidebar-logo-text">
          Library
          <br />
          <span>Support System</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || "Student"}</div>
          <div className="sidebar-user-id">ID: {user?.studentId || "—"}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <p className="need-help-text">Need immediate help?</p>
        <button
          className="contact-support-btn"
          onClick={() => navigate("/livechat")}
        >
          Contact Support
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
