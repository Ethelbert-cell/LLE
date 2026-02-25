import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => (
  <div className="app-shell">
    <Sidebar />
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout;
