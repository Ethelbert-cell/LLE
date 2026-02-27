import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}/${m}/${y}`;
  }
  return d;
};

const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
};

// Auto-complete: booking is completed if date+endTime is in the past
const isExpired = (date, endTime) => {
  const now = new Date();
  const end = new Date(`${date}T${endTime}:00`);
  return end < now;
};

const STATUS_MAP = {
  confirmed: { cls: "badge-confirmed", label: "Confirmed" },
  pending: { cls: "badge-pending", label: "Pending" },
  cancelled: { cls: "badge-cancelled", label: "Cancelled" },
  completed: { cls: "badge-approved", label: "Completed" },
};

const StatusBadge = ({ booking }) => {
  const effectiveStatus =
    (booking.status === "confirmed" || booking.status === "pending") &&
    isExpired(booking.date, booking.endTime)
      ? "completed"
      : booking.status;
  const { cls, label } = STATUS_MAP[effectiveStatus] || STATUS_MAP.pending;
  return <span className={`badge ${cls}`}>{label}</span>;
};

// ─── Component ────────────────────────────────────────────────────────────────
const AdminViewBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null); // booking _id being actioned
  const [hoverId, setHoverId] = useState(null);

  const headers = { Authorization: `Bearer ${user?.token}` };

  const fetchBookings = useCallback(() => {
    setLoading(true);
    axios
      .get("/api/bookings", { headers })
      .then((r) => setBookings(r.data))
      .catch(() =>
        setBookings([
          {
            _id: "1",
            student: { name: "Alex Johnson" },
            room: { name: "Group Study 4A" },
            date: "2026-02-28",
            startTime: "10:00",
            endTime: "12:00",
            status: "confirmed",
            purpose: "Final year project meeting",
          },
          {
            _id: "2",
            student: { name: "Maria Garcia" },
            room: { name: "Quiet Zone 12" },
            date: "2026-02-28",
            startTime: "13:00",
            endTime: "15:00",
            status: "pending",
            purpose: "Research session",
          },
          {
            _id: "3",
            student: { name: "David Chen" },
            room: { name: "Multimedia Lab" },
            date: "2026-02-26",
            startTime: "09:00",
            endTime: "11:00",
            status: "confirmed",
            purpose: "",
          },
          {
            _id: "4",
            student: { name: "Sarah Miller" },
            room: { name: "Group Study 1B" },
            date: "2026-03-01",
            startTime: "14:00",
            endTime: "16:00",
            status: "confirmed",
            purpose: "Study group",
          },
          {
            _id: "5",
            student: { name: "Robert Wilson" },
            room: { name: "Private Pod 05" },
            date: "2026-02-27",
            startTime: "11:00",
            endTime: "13:00",
            status: "cancelled",
            purpose: "",
          },
        ]),
      )
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ── Status update (admin action) ────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setActionLoading(id);
    try {
      await axios.patch(
        `/api/bookings/${id}/status`,
        { status: newStatus },
        { headers },
      );
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b)),
      );
    } catch {
      // silently fail — booking keeps its current status
    } finally {
      setActionLoading(null);
    }
  };

  const displayed =
    filter === "all"
      ? bookings
      : bookings.filter((b) => {
          const eff =
            (b.status === "confirmed" || b.status === "pending") &&
            isExpired(b.date, b.endTime)
              ? "completed"
              : b.status;
          return eff === filter;
        });

  const FILTERS = ["all", "confirmed", "pending", "completed", "cancelled"];

  return (
    <div className="page-container" style={{ maxWidth: 1200 }}>
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
          Manage and action all study room reservations. Hover over a row to see
          the booking purpose.
        </p>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        {FILTERS.map((f) => {
          const count =
            f === "all"
              ? bookings.length
              : bookings.filter((b) => {
                  const eff =
                    (b.status === "confirmed" || b.status === "pending") &&
                    isExpired(b.date, b.endTime)
                      ? "completed"
                      : b.status;
                  return eff === f;
                }).length;
          return (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span
                style={{
                  marginLeft: "0.35rem",
                  opacity: 0.7,
                  fontSize: "0.72rem",
                }}
              >
                ({count})
              </span>
            </button>
          );
        })}
        <button
          className="btn btn-sm btn-secondary"
          onClick={fetchBookings}
          style={{ marginLeft: "auto" }}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <table className="bookings-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "1.5rem" }}>Student</th>
                <th>Room</th>
                <th>Date</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((b) => {
                const expired = isExpired(b.date, b.endTime);
                const effectiveStatus =
                  (b.status === "confirmed" || b.status === "pending") &&
                  expired
                    ? "completed"
                    : b.status;
                const isActioning = actionLoading === b._id;

                return (
                  <tr
                    key={b._id}
                    onMouseEnter={() => setHoverId(b._id)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{ position: "relative", cursor: "default" }}
                  >
                    <td style={{ paddingLeft: "1.5rem", fontWeight: 500 }}>
                      {b.student?.name || "—"}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {b.room?.name || "—"}
                    </td>
                    <td
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {formatDate(b.date)}
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {fmtTime(b.startTime)}
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {fmtTime(b.endTime)}
                    </td>
                    <td>
                      <StatusBadge booking={b} />
                    </td>
                    <td>
                      {effectiveStatus === "completed" ||
                      effectiveStatus === "cancelled" ? (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.75rem",
                          }}
                        >
                          —
                        </span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.35rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {effectiveStatus !== "confirmed" && (
                            <button
                              className="btn btn-sm"
                              disabled={isActioning}
                              onClick={() => updateStatus(b._id, "confirmed")}
                              style={{
                                background: "rgba(59,130,246,0.1)",
                                color: "var(--accent-blue)",
                                border: "1px solid rgba(59,130,246,0.2)",
                                padding: "0.3rem 0.65rem",
                                fontSize: "0.73rem",
                              }}
                            >
                              {isActioning ? "…" : "Confirm"}
                            </button>
                          )}
                          {effectiveStatus !== "pending" && (
                            <button
                              className="btn btn-sm"
                              disabled={isActioning}
                              onClick={() => updateStatus(b._id, "pending")}
                              style={{
                                background: "rgba(234,179,8,0.08)",
                                color: "#fbbf24",
                                border: "1px solid rgba(251,191,36,0.2)",
                                padding: "0.3rem 0.65rem",
                                fontSize: "0.73rem",
                              }}
                            >
                              {isActioning ? "…" : "Pending"}
                            </button>
                          )}
                          <button
                            className="btn btn-sm"
                            disabled={isActioning}
                            onClick={() => updateStatus(b._id, "cancelled")}
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              color: "#f87171",
                              border: "1px solid rgba(248,113,113,0.2)",
                              padding: "0.3rem 0.65rem",
                              fontSize: "0.73rem",
                            }}
                          >
                            {isActioning ? "…" : "Cancel"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Hover tooltip row for purpose */}
              {displayed.map((b) =>
                hoverId === b._id && b.purpose ? (
                  <tr
                    key={`${b._id}-purpose`}
                    style={{ background: "rgba(59,130,246,0.05)" }}
                  >
                    <td
                      colSpan={7}
                      style={{
                        paddingLeft: "1.5rem",
                        paddingTop: "0.3rem",
                        paddingBottom: "0.55rem",
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                        borderTop: "none",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-muted)",
                          marginRight: "0.5rem",
                        }}
                      >
                        Purpose:
                      </span>
                      {b.purpose}
                    </td>
                  </tr>
                ) : null,
              )}
              {displayed.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="empty-state"
                    style={{ padding: "2.5rem" }}
                  >
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
