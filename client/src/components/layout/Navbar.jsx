import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const BellIcon = () => (
  <svg
    width="16"
    height="16"
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

const Navbar = () => {
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
    <header className="navbar">
      <button
        className="navbar-icon-btn"
        title="Notifications"
        aria-label="Notifications"
      >
        <BellIcon />
      </button>
      <div
        className="navbar-avatar"
        title={user?.name}
        onClick={() => {
          logout();
          navigate("/login");
        }}
        role="button"
        aria-label="User menu"
      >
        {initials}
      </div>
    </header>
  );
};

export default Navbar;
