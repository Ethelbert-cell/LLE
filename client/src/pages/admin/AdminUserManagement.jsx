import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const AdminUserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get("/api/users", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((r) => setUsers(r.data))
      .catch(() =>
        setUsers([
          {
            _id: 1,
            name: "Alex Morgan",
            email: "alex.morgan@university.edu",
            role: "student",
            studentId: "482910",
            createdAt: new Date().toISOString(),
          },
          {
            _id: 2,
            name: "Library Admin",
            email: "admin@library.edu",
            role: "admin",
            createdAt: new Date().toISOString(),
          },
          {
            _id: 3,
            name: "James Carter",
            email: "james.carter@university.edu",
            role: "student",
            studentId: "502843",
            createdAt: new Date().toISOString(),
          },
        ]),
      )
      .finally(() => setLoading(false));
  }, [user]);

  const displayed = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const formatDate = (d) =>
    new Date(d).toLocaleDateString([], { dateStyle: "medium" });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <div
          style={{
            height: 3,
            width: 60,
            background: "var(--accent-blue)",
            margin: "0.5rem 0",
          }}
        />
        <p className="page-subtitle">
          View and manage all registered students and librarians.
        </p>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <input
          className="form-input"
          style={{ maxWidth: 320 }}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <table className="bookings-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "1.5rem" }}>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((u) => (
                <tr key={u._id}>
                  <td style={{ paddingLeft: "1.5rem", fontWeight: 600 }}>
                    {u.name}
                  </td>
                  <td
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.82rem",
                    }}
                  >
                    {u.email}
                  </td>
                  <td
                    style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                  >
                    {u.studentId || "—"}
                  </td>
                  <td>
                    <span
                      className={`badge ${u.role === "admin" ? "badge-confirmed" : "badge-approved"}`}
                    >
                      {u.role === "admin" ? "Librarian" : "Student"}
                    </span>
                  </td>
                  <td
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
              {!displayed.length && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
