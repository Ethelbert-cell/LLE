import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const fmt12 = (t) => {
  if (!t) return t;
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

// ─── AdminManageSchedule ──────────────────────────────────────────────────────
const AdminManageSchedule = () => {
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user?.token}` };

  const [tab, setTab] = useState("meetings"); // "meetings" | "availability"

  // ── Meetings tab ────────────────────────────────────────────────────────────
  const [meetings, setMeetings] = useState([]);
  const [loadingM, setLoadingM] = useState(true);
  const [filterM, setFilterM] = useState("all");
  const [actionId, setActionId] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [note, setNote] = useState("");

  const fetchMeetings = useCallback(() => {
    setLoadingM(true);
    axios
      .get("/api/meetings", { headers })
      .then((r) => setMeetings(r.data))
      .catch(() => setMeetings([]))
      .finally(() => setLoadingM(false));
  }, [user]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const updateMeeting = async (id, status) => {
    setActionId(id);
    try {
      const res = await axios.put(
        `/api/meetings/${id}`,
        { status, librarianNote: note },
        { headers },
      );
      setMeetings((prev) => prev.map((m) => (m._id === id ? res.data : m)));
      setNoteId(null);
      setNote("");
    } catch {}
    setActionId(null);
  };

  const STATUS_MAP = {
    pending: "badge-pending",
    approved: "badge-approved",
    rejected: "badge-cancelled",
    cancelled: "badge-cancelled",
  };
  const FILTERS = ["all", "pending", "approved", "rejected", "cancelled"];

  const displayed =
    filterM === "all" ? meetings : meetings.filter((m) => m.status === filterM);

  // ── Availability tab ────────────────────────────────────────────────────────
  const [librarians, setLibrarians] = useState([]);
  const [loadingL, setLoadingL] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [editHours, setEditHours] = useState({}); // { [libId]: workingHours copy }

  const fetchLibrarians = useCallback(() => {
    setLoadingL(true);
    axios
      .get("/api/users/librarians/all", { headers })
      .then((r) => {
        setLibrarians(r.data);
        const hours = {};
        r.data.forEach((l) => {
          hours[l._id] = JSON.parse(JSON.stringify(l.workingHours || {}));
        });
        setEditHours(hours);
      })
      .catch(() => setLibrarians([]))
      .finally(() => setLoadingL(false));
  }, [user]);

  useEffect(() => {
    if (tab === "availability") fetchLibrarians();
  }, [tab, fetchLibrarians]);

  const toggleAvailability = async (lib) => {
    try {
      const res = await axios.patch(
        `/api/users/librarians/${lib._id}/availability`,
        { isAvailable: !lib.isAvailable },
        { headers },
      );
      setLibrarians((prev) =>
        prev.map((l) => (l._id === lib._id ? res.data : l)),
      );
    } catch {}
  };

  const saveHours = async (libId) => {
    setSavingId(libId);
    try {
      const res = await axios.put(
        `/api/users/librarians/${libId}/hours`,
        { workingHours: editHours[libId] },
        { headers },
      );
      setLibrarians((prev) =>
        prev.map((l) => (l._id === libId ? res.data : l)),
      );
    } catch {}
    setSavingId(null);
  };

  const updateHour = (libId, day, field, value) => {
    setEditHours((prev) => ({
      ...prev,
      [libId]: {
        ...prev[libId],
        [day]: { ...prev[libId]?.[day], [field]: value },
      },
    }));
  };

  return (
    <div className="page-container" style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <h1 className="page-title">Manage Librarian Schedule</h1>
        <div
          style={{
            height: 3,
            width: 60,
            background: "var(--accent-blue)",
            margin: "0.5rem 0",
          }}
        />
        <p className="page-subtitle">
          Review meeting requests and configure librarian availability and
          working hours.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          className={`btn ${tab === "meetings" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("meetings")}
        >
          📋 Meeting Requests (
          {meetings.filter((m) => m.status === "pending").length} pending)
        </button>
        <button
          className={`btn ${tab === "availability" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("availability")}
        >
          🕐 Librarian Availability
        </button>
      </div>

      {/* ══ Meetings Tab ══════════════════════════════════════════════════════ */}
      {tab === "meetings" && (
        <>
          {/* Filter row */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            {FILTERS.map((f) => {
              const cnt =
                f === "all"
                  ? meetings.length
                  : meetings.filter((m) => m.status === f).length;
              return (
                <button
                  key={f}
                  className={`btn btn-sm ${filterM === f ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterM(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
                  <span style={{ opacity: 0.7, fontSize: "0.72rem" }}>
                    ({cnt})
                  </span>
                </button>
              );
            })}
            <button
              className="btn btn-sm btn-secondary"
              onClick={fetchMeetings}
              style={{ marginLeft: "auto" }}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loadingM ? (
              <div className="spinner" />
            ) : (
              <table className="bookings-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "1.5rem" }}>Student</th>
                    <th>Librarian</th>
                    <th>Topic</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((m) => (
                    <>
                      <tr key={m._id}>
                        <td style={{ paddingLeft: "1.5rem", fontWeight: 500 }}>
                          {m.student?.name || "—"}
                        </td>
                        <td
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {m.librarian?.name || "—"}
                        </td>
                        <td
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {m.topic}
                        </td>
                        <td style={{ fontSize: "0.82rem" }}>
                          {fmtDate(m.requestedDate)}
                        </td>
                        <td style={{ fontSize: "0.82rem" }}>
                          {fmt12(m.preferredTime)}
                        </td>
                        <td>
                          <span
                            className={`badge ${STATUS_MAP[m.status] || "badge-pending"}`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td>
                          {m.status === "pending" ? (
                            <div
                              style={{
                                display: "flex",
                                gap: "0.35rem",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                className="btn btn-sm"
                                disabled={actionId === m._id}
                                onClick={() =>
                                  setNoteId(noteId === m._id ? null : m._id)
                                }
                                style={{
                                  background: "rgba(59,130,246,0.1)",
                                  color: "var(--accent-blue)",
                                  border: "1px solid rgba(59,130,246,0.2)",
                                  padding: "0.3rem 0.65rem",
                                  fontSize: "0.73rem",
                                }}
                              >
                                Add Note
                              </button>
                              <button
                                className="btn btn-sm"
                                disabled={actionId === m._id}
                                onClick={() => updateMeeting(m._id, "approved")}
                                style={{
                                  background: "rgba(34,197,94,0.1)",
                                  color: "#4ade80",
                                  border: "1px solid rgba(74,222,128,0.2)",
                                  padding: "0.3rem 0.65rem",
                                  fontSize: "0.73rem",
                                }}
                              >
                                {actionId === m._id ? "…" : "Approve"}
                              </button>
                              <button
                                className="btn btn-sm"
                                disabled={actionId === m._id}
                                onClick={() => updateMeeting(m._id, "rejected")}
                                style={{
                                  background: "rgba(239,68,68,0.08)",
                                  color: "#f87171",
                                  border: "1px solid rgba(248,113,113,0.2)",
                                  padding: "0.3rem 0.65rem",
                                  fontSize: "0.73rem",
                                }}
                              >
                                {actionId === m._id ? "…" : "Reject"}
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "0.75rem",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Note input row */}
                      {noteId === m._id && (
                        <tr
                          key={`${m._id}-note`}
                          style={{ background: "rgba(59,130,246,0.04)" }}
                        >
                          <td
                            colSpan={7}
                            style={{
                              paddingLeft: "1.5rem",
                              paddingBottom: "0.75rem",
                              paddingTop: "0.25rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "0.5rem",
                                alignItems: "center",
                              }}
                            >
                              <input
                                className="form-input"
                                style={{
                                  flex: 1,
                                  fontSize: "0.8rem",
                                  padding: "0.4rem 0.65rem",
                                }}
                                placeholder="Optional note to student…"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                              />
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => updateMeeting(m._id, "approved")}
                              >
                                Approve with Note
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  setNoteId(null);
                                  setNote("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {displayed.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="empty-state"
                        style={{ padding: "2.5rem" }}
                      >
                        No requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ══ Availability Tab ═══════════════════════════════════════════════════ */}
      {tab === "availability" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {loadingL ? (
            <div className="spinner" />
          ) : (
            librarians.map((lib) => {
              const hours = editHours[lib._id] || {};
              return (
                <div key={lib._id} className="card">
                  {/* Header row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        {lib.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {lib.specialty || "Librarian"} · {lib.email}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: lib.isAvailable ? "#4ade80" : "#f87171",
                        }}
                      >
                        {lib.isAvailable ? "🟢 Available" : "🔴 Unavailable"}
                      </span>
                      <button
                        className={`btn btn-sm ${lib.isAvailable ? "" : "btn-primary"}`}
                        onClick={() => toggleAvailability(lib)}
                        style={
                          lib.isAvailable
                            ? {
                                background: "rgba(239,68,68,0.08)",
                                color: "#f87171",
                                border: "1px solid rgba(248,113,113,0.2)",
                              }
                            : {}
                        }
                      >
                        {lib.isAvailable ? "Set Unavailable" : "Set Available"}
                      </button>
                    </div>
                  </div>

                  {/* Working hours grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {DAY_KEYS.map((dk) => {
                      const dh = hours[dk] || {};
                      return (
                        <div
                          key={dk}
                          style={{
                            background: "var(--bg-input)",
                            border: "1px solid var(--border)",
                            padding: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <span
                              style={{ fontWeight: 600, fontSize: "0.82rem" }}
                            >
                              {DAY_LABELS[dk]}
                            </span>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={!!dh.enabled}
                                onChange={(e) =>
                                  updateHour(
                                    lib._id,
                                    dk,
                                    "enabled",
                                    e.target.checked,
                                  )
                                }
                              />
                              Active
                            </label>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "0.4rem",
                              opacity: dh.enabled ? 1 : 0.4,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "0.67rem",
                                  color: "var(--text-muted)",
                                  marginBottom: "0.15rem",
                                }}
                              >
                                Open
                              </div>
                              <input
                                type="time"
                                className="form-input"
                                style={{
                                  padding: "0.3rem 0.5rem",
                                  fontSize: "0.78rem",
                                }}
                                value={dh.open || "09:00"}
                                disabled={!dh.enabled}
                                onChange={(e) =>
                                  updateHour(
                                    lib._id,
                                    dk,
                                    "open",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: "0.67rem",
                                  color: "var(--text-muted)",
                                  marginBottom: "0.15rem",
                                }}
                              >
                                Close
                              </div>
                              <input
                                type="time"
                                className="form-input"
                                style={{
                                  padding: "0.3rem 0.5rem",
                                  fontSize: "0.78rem",
                                }}
                                value={dh.close || "17:00"}
                                disabled={!dh.enabled}
                                onChange={(e) =>
                                  updateHour(
                                    lib._id,
                                    dk,
                                    "close",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={savingId === lib._id}
                      onClick={() => saveHours(lib._id)}
                    >
                      {savingId === lib._id
                        ? "Saving…"
                        : "💾 Save Working Hours"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
          {!loadingL && librarians.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <div className="empty-state-text">
                No librarians in the system. Run the seed script.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminManageSchedule;
