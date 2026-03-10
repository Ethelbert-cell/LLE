import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../NotificationBell";

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
      <NotificationBell />
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
