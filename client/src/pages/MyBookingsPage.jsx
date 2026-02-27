import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  const [y, mo, day] = d.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[parseInt(mo, 10) - 1]} ${y}`;
};

// Get start/end as Date objects from booking
const bookingWindow = (b) => ({
  start: new Date(`${b.date}T${b.startTime}:00`),
  end: new Date(`${b.date}T${b.endTime}:00`),
});

// Returns effective status accounting for elapsed time
const effectiveStatus = (b, now) => {
  if (b.status === "cancelled") return "cancelled";
  const { start, end } = bookingWindow(b);
  if (now >= end) return "completed";
  if (now >= start) return "ongoing";
  return b.status; // 'confirmed' or 'pending'
};

// Human countdown: "2h 15m" or "45m" or "30 sec"
const countdown = (target, now) => {
  const diff = Math.floor((target - now) / 1000);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s < 10 ? "0" + s : s}s`;
  return `${s}s`;
};

// Badge config
const STATUS_BADGE = {
  confirmed: { cls: "badge-confirmed", label: "Confirmed" },
  pending: { cls: "badge-pending", label: "Pending" },
  cancelled: { cls: "badge-cancelled", label: "Cancelled" },
  completed: { cls: "badge-approved", label: "Completed" },
  ongoing: { cls: "badge-confirmed", label: "Ongoing" },
};

// ─── Session Alert Banner (ongoing / upcoming) ─────────────────────────────
const SessionBanner = ({ bookings, now }) => {
  const active = bookings
    .filter((b) => b.status !== "cancelled")
    .map((b) => ({ b, eff: effectiveStatus(b, now), ...bookingWindow(b) }))
    .filter(
      ({ eff, start }) =>
        eff === "ongoing" ||
        ((eff === "confirmed" || eff === "pending") &&
          start > now &&
          start - now <= 31 * 60 * 1000),
    )
    .sort((a, b) => a.start - b.start);

  if (!active.length) return null;

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      {active.map(({ b, eff, start, end }) => {
        const isOngoing = eff === "ongoing";
        const mins = Math.floor((end - now) / 60000);
        const cd = countdown(start, now);

        return (
          <div
            key={b._id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.85rem 1.25rem",
              background: isOngoing
                ? "rgba(34,197,94,0.08)"
                : "rgba(59,130,246,0.08)",
              border: `1px solid ${isOngoing ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.25)"}`,
              animation: "fadeUp 0.3s ease both",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>
              {isOngoing ? "🟢" : "⏰"}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                }}
              >
                {isOngoing
                  ? `Ongoing Session — ${b.room?.name}`
                  : `Your booking starts in ${cd} — ${b.room?.name}`}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.2rem",
                }}
              >
                {fmtDate(b.date)} · {fmt12(b.startTime)} – {fmt12(b.endTime)}
                {isOngoing && ` · ends in ${mins}m`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const MyBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loadingB, setLoadingB] = useState(true);
  const [loadingM, setLoadingM] = useState(true);
  const [now, setNow] = useState(new Date());
  const cancellingRef = useRef(null);

  const headers = { Authorization: `Bearer ${user?.token}` };

  // ── Live clock — ticks every 10 seconds ──────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  // ── Fetch my bookings ─────────────────────────────────────────────────────
  const fetchBookings = useCallback(() => {
    setLoadingB(true);
    axios
      .get("/api/bookings/my", { headers })
      .then((r) => setBookings(r.data))
      .catch(() => setBookings([]))
      .finally(() => setLoadingB(false));
  }, [user]);

  // ── Fetch my meetings ─────────────────────────────────────────────────────
  const fetchMeetings = useCallback(() => {
    setLoadingM(true);
    axios
      .get("/api/meetings/my", { headers })
      .then((r) => setMeetings(r.data))
      .catch(() => setMeetings([]))
      .finally(() => setLoadingM(false));
  }, [user]);

  useEffect(() => {
    fetchBookings();
    fetchMeetings();
  }, [fetchBookings, fetchMeetings]);

  // ── Cancel booking ────────────────────────────────────────────────────────
  const cancelBooking = async (id) => {
    cancellingRef.current = id;
    try {
      await axios.delete(`/api/bookings/${id}`, { headers });
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b)),
      );
    } catch {}
    cancellingRef.current = null;
  };

  // ── Cancel meeting ────────────────────────────────────────────────────────
  const cancelMeeting = async (id) => {
    try {
      await axios.delete(`/api/meetings/${id}`, { headers });
      setMeetings((prev) => prev.filter((m) => m._id !== id));
    } catch {}
  };

  // ── Derived effective bookings ────────────────────────────────────────────
  const enriched = bookings.map((b) => ({
    ...b,
    _eff: effectiveStatus(b, now),
  }));
  const activeCount = enriched.filter(
    (b) => !["cancelled", "completed"].includes(b._eff),
  ).length;

  // Sort: ongoing first, then upcoming by date, then completed, then cancelled
  const sortOrder = {
    ongoing: 0,
    confirmed: 1,
    pending: 2,
    completed: 3,
    cancelled: 4,
  };
  const sortedBookings = [...enriched].sort(
    (a, b) => sortOrder[a._eff] - sortOrder[b._eff],
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">
          Manage all your room reservations and librarian appointments.
        </p>
      </div>

      {/* ── Session Alerts (ongoing / 30-min warning) ─────────────────────── */}
      <SessionBanner bookings={bookings} now={now} />

      {/* ── Tab Switcher ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          className={`btn ${tab === "bookings" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("bookings")}
        >
          🚪 Room Bookings ({activeCount})
        </button>
        <button
          className={`btn ${tab === "meetings" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("meetings")}
        >
          🗓 Meeting Requests (
          {meetings.filter((m) => m.status === "pending").length})
        </button>
      </div>

      {/* ══ Room Bookings Tab ══════════════════════════════════════════════ */}
      {tab === "bookings" && (
        <>
          {loadingB ? (
            <div className="spinner" />
          ) : sortedBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚪</div>
              <div className="empty-state-text">No bookings yet.</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => navigate("/booking")}
              >
                Book a Room
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="bookings-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "1.5rem" }}>Room</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Countdown</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((b) => {
                    const eff = b._eff;
                    const { start, end } = bookingWindow(b);
                    const cd =
                      eff === "ongoing"
                        ? `Ends in ${countdown(end, now) || "< 1s"}`
                        : (eff === "confirmed" || eff === "pending") &&
                            start > now
                          ? `Starts in ${countdown(start, now)}`
                          : null;

                    const { cls, label } =
                      STATUS_BADGE[eff] || STATUS_BADGE.pending;
                    const canCancel = ![
                      "cancelled",
                      "completed",
                      "ongoing",
                    ].includes(eff);

                    return (
                      <tr
                        key={b._id}
                        style={{
                          background:
                            eff === "ongoing"
                              ? "rgba(34,197,94,0.04)"
                              : undefined,
                          transition: "background 0.3s",
                        }}
                      >
                        {/* Room */}
                        <td style={{ paddingLeft: "1.5rem" }}>
                          <div style={{ fontWeight: 600 }}>
                            {b.room?.name || "—"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {b.room?.location || ""}
                          </div>
                        </td>
                        {/* Date */}
                        <td style={{ fontSize: "0.82rem" }}>
                          {fmtDate(b.date)}
                        </td>
                        {/* Time */}
                        <td
                          style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}
                        >
                          {fmt12(b.startTime)} – {fmt12(b.endTime)}
                        </td>
                        {/* Purpose */}
                        <td
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.8rem",
                          }}
                        >
                          {b.purpose || "—"}
                        </td>
                        {/* Status */}
                        <td>
                          {eff === "ongoing" ? (
                            <span
                              className="badge badge-confirmed"
                              style={{
                                background: "rgba(34,197,94,0.15)",
                                color: "#4ade80",
                                borderColor: "rgba(74,222,128,0.3)",
                              }}
                            >
                              🟢 Ongoing
                            </span>
                          ) : (
                            <span className={`badge ${cls}`}>{label}</span>
                          )}
                        </td>
                        {/* Countdown */}
                        <td
                          style={{
                            fontSize: "0.8rem",
                            color:
                              eff === "ongoing"
                                ? "#4ade80"
                                : "var(--accent-blue)",
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cd || (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </td>
                        {/* Action */}
                        <td>
                          {canCancel ? (
                            <button
                              className="btn btn-sm"
                              onClick={() => cancelBooking(b._id)}
                              style={{
                                background: "rgba(239,68,68,0.08)",
                                color: "#f87171",
                                border: "1px solid rgba(248,113,113,0.2)",
                                padding: "0.3rem 0.75rem",
                                fontSize: "0.73rem",
                              }}
                            >
                              Cancel
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══ Meeting Requests Tab ═══════════════════════════════════════════ */}
      {tab === "meetings" && (
        <>
          {loadingM ? (
            <div className="spinner" />
          ) : meetings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗓</div>
              <div className="empty-state-text">No meeting requests yet.</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
                onClick={() => navigate("/scheduling")}
              >
                Schedule a Meeting
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="bookings-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "1.5rem" }}>Topic</th>
                    <th>Requested Date</th>
                    <th>Status</th>
                    <th>Librarian Note</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m) => {
                    const statusMap = {
                      pending: "badge-pending",
                      approved: "badge-approved",
                      rejected: "badge-cancelled",
                    };
                    return (
                      <tr key={m._id}>
                        <td style={{ paddingLeft: "1.5rem", fontWeight: 600 }}>
                          {m.topic}
                        </td>
                        <td style={{ fontSize: "0.82rem" }}>
                          {fmtDate(m.requestedDate?.split("T")[0])}{" "}
                          {m.preferredTime ? `· ${fmt12(m.preferredTime)}` : ""}
                        </td>
                        <td>
                          <span
                            className={`badge ${statusMap[m.status] || "badge-pending"}`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {m.librarianNote || "—"}
                        </td>
                        <td>
                          {m.status === "pending" ? (
                            <button
                              className="btn btn-sm"
                              onClick={() => cancelMeeting(m._id)}
                              style={{
                                background: "rgba(239,68,68,0.08)",
                                color: "#f87171",
                                border: "1px solid rgba(248,113,113,0.2)",
                                padding: "0.3rem 0.75rem",
                                fontSize: "0.73rem",
                              }}
                            >
                              Cancel
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyBookingsPage;
