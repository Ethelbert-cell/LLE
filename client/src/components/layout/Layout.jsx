import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * Shared layout shell for both student and admin views.
 * isAdmin flag is passed down when used under the /admin route.
 */
const Layout = ({ isAdmin = false }) => {
  return (
    <div className="app-shell">
      <Sidebar isAdmin={isAdmin} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
