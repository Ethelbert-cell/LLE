import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BellIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="navbar" style={{ justifyContent: "space-between" }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Library Support System
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            borderLeft: "1px solid var(--border)",
            paddingLeft: "0.75rem",
          }}
        >
          Admin Panel
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button className="navbar-icon-btn" title="Notifications">
          <BellIcon />
        </button>
        <button
          onClick={handleLogout}
          className="btn btn-primary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;
