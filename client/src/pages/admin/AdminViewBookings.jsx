import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const StatusBadge = ({ status }) => {
  const map = {
    confirmed: "badge-confirmed",
    pending: "badge-pending",
    cancelled: "badge-cancelled",
    completed: "badge-cancelled",
  };
  return (
    <span className={`badge ${map[status] || "badge-pending"}`}>{status}</span>
  );
};

const AdminViewBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axios
      .get("/api/bookings", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((r) => setBookings(r.data))
      .catch(() =>
        setBookings([
          {
            _id: 1,
            student: { name: "Alex Johnson" },
            room: { name: "Group Study 4A" },
            startTime: new Date().toISOString(),
            status: "confirmed",
          },
          {
            _id: 2,
            student: { name: "Maria Garcia" },
            room: { name: "Quiet Zone 12" },
            startTime: new Date().toISOString(),
            status: "pending",
          },
          {
            _id: 3,
            student: { name: "David Chen" },
            room: { name: "Multimedia Lab" },
            startTime: new Date().toISOString(),
            status: "completed",
          },
        ]),
      )
      .finally(() => setLoading(false));
  }, [user]);

  const formatDate = (d) =>
    new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  const displayed =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">View All Bookings</h1>
        <div
          style={{
            height: 3,
            width: 60,
            background: "var(--accent-blue)",
            margin: "0.5rem 0",
          }}
        />
        <p className="page-subtitle">
          All study room bookings across the system.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        {["all", "confirmed", "pending", "cancelled", "completed"].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <table className="bookings-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "1.5rem" }}>Student</th>
                <th>Room</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((b) => (
                <tr key={b._id}>
                  <td style={{ paddingLeft: "1.5rem", fontWeight: 500 }}>
                    {b.student?.name || "—"}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {b.room?.name || "—"}
                  </td>
                  <td
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {formatDate(b.startTime)}
                  </td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
              {!displayed.length && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No bookings found.
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

export default AdminViewBookings;
