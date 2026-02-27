import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

const AdminLayout = () => (
  <div className="app-shell">
    <AdminSidebar />
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <AdminNavbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
