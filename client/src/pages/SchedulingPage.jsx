import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const TOPICS = [
  "Research Assistance",
  "Citation & Referencing Help",
  "Database Access",
  "Thesis Support",
  "Book Recommendation",
  "Workshop Registration",
  "Other",
];

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

// Get day-of-week index (0=Sun) from "YYYY-MM-DD"
const dowIdx = (dateStr) => new Date(dateStr + "T12:00:00").getDay();
const dowKey = (dateStr) => DAY_KEYS[dowIdx(dateStr)];

// Generate 1-hour slots between open and close ("09:00"→"17:00" gives ["09:00"…"16:00"])
const generateSlots = (open, close) => {
  const slots = [];
  let [h] = open.split(":").map(Number);
  const [ch] = close.split(":").map(Number);
  while (h < ch) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    h++;
  }
  return slots;
};

// 12-hour display
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

const STATUS_CLS = {
  pending: "badge-pending",
  approved: "badge-approved",
  rejected: "badge-cancelled",
  cancelled: "badge-cancelled",
};

// ─── Component ────────────────────────────────────────────────────────────────
const SchedulingPage = () => {
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user?.token}` };

  // ── Data ────────────────────────────────────────────────────────────────────
  const [librarians, setLibrarians] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [settings, setSettings] = useState({ maxAdvanceDays: 7 });
  const [bookedSlots, setBookedSlots] = useState([]); // taken slots for selected librarian+date

  const [loadingLibs, setLoadingLibs] = useState(true);
  const [loadingMtgs, setLoadingMtgs] = useState(true);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [selectedLib, setSelectedLib] = useState(null);
  const [form, setForm] = useState({
    date: "",
    time: "",
    topic: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 6000);
  };

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get("/api/users/librarians")
      .then((r) => setLibrarians(r.data))
      .catch(() => setLibrarians([]))
      .finally(() => setLoadingLibs(false));
    axios
      .get("/api/settings")
      .then((r) => setSettings(r.data))
      .catch(() => {});
    if (user?.token) {
      axios
        .get("/api/meetings/my", { headers })
        .then((r) => setMeetings(r.data))
        .catch(() => setMeetings([]))
        .finally(() => setLoadingMtgs(false));
    }
  }, [user]);

  // ── Fetch booked slots when librarian+date both selected ───────────────────
  // Uses the public /slots endpoint — no auth needed, returns only taken times.
  useEffect(() => {
    if (!selectedLib || !form.date) {
      setBookedSlots([]);
      return;
    }
    axios
      .get(
        `/api/meetings/slots?librarianId=${selectedLib._id}&date=${form.date}`,
      )
      .then((r) => setBookedSlots(r.data))
      .catch(() => setBookedSlots([]));
  }, [selectedLib, form.date]);

  // ── Derived: what days this librarian works ─────────────────────────────────
  const workingDayIndices = useMemo(() => {
    if (!selectedLib) return [];
    return DAY_KEYS.map((k, i) =>
      selectedLib.workingHours?.[k]?.enabled ? i : -1,
    ).filter((i) => i >= 0);
  }, [selectedLib]);

  // ── Derived: available time slots for selected date ─────────────────────────
  const timeSlots = useMemo(() => {
    if (!selectedLib || !form.date) return [];
    const dk = dowKey(form.date);
    const dh = selectedLib.workingHours?.[dk];
    if (!dh?.enabled) return [];
    return generateSlots(dh.open, dh.close).filter(
      (s) => !bookedSlots.includes(s),
    );
  }, [selectedLib, form.date, bookedSlots]);

  // ── Min / max date (tomorrow … +maxAdvanceDays) ─────────────────────────────
  const minDate = getTomorrow();
  const maxDate = addDays(settings.maxAdvanceDays || 7);

  // ── Librarian select ────────────────────────────────────────────────────────
  const selectLibrarian = (lib) => {
    setSelectedLib(lib);
    setForm({ date: "", time: "", topic: "", notes: "" });
    setBookedSlots([]);
  };

  // ── Date change ─────────────────────────────────────────────────────────────
  const handleDateChange = (e) => {
    const date = e.target.value;
    const dk = dowKey(date);
    const dayWorks = selectedLib?.workingHours?.[dk]?.enabled;
    if (!dayWorks) {
      showAlert(
        "alert-error",
        `${selectedLib.name} does not work on ${DAY_NAMES[dowIdx(date)]}s.`,
      );
      return;
    }
    setForm((prev) => ({ ...prev, date, time: "" }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLib)
      return showAlert("alert-error", "Please select a librarian.");
    if (!form.date || !form.time || !form.topic)
      return showAlert("alert-error", "Please fill in all required fields.");
    setSubmitting(true);
    try {
      const res = await axios.post(
        "/api/meetings",
        {
          librarian: selectedLib._id,
          requestedDate: form.date,
          preferredTime: form.time,
          topic: form.topic,
          notes: form.notes,
        },
        { headers },
      );
      setMeetings((prev) => [res.data, ...prev]);
      showAlert(
        "alert-success",
        `✅ Meeting request sent to ${selectedLib.name}! They will confirm shortly.`,
      );
      setForm({ date: "", time: "", topic: "", notes: "" });
      setSelectedLib(null);
    } catch (err) {
      showAlert(
        "alert-error",
        `⛔ ${err?.response?.data?.message || "Request failed. Please try again."}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel meeting ──────────────────────────────────────────────────────────
  const cancelMeeting = async (id) => {
    try {
      await axios.delete(`/api/meetings/${id}`, { headers });
      setMeetings((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "cancelled" } : m)),
      );
    } catch {}
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Librarian Scheduling</h1>
        <p className="page-subtitle">
          Book a one-on-one consultation with one of our subject librarians.
        </p>
      </div>

      {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* ── LEFT: Request Form ─────────────────────────────────────────── */}
        <div className="card">
          <div className="card-title">📝 New Meeting Request</div>

          {/* Step 1: Pick librarian */}
          <div className="form-group">
            <label className="form-label">
              Select Librarian <span style={{ color: "#f87171" }}>*</span>
            </label>
            {loadingLibs ? (
              <div className="spinner" />
            ) : librarians.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No librarians available right now.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                {librarians.map((lib) => (
                  <div
                    key={lib._id}
                    onClick={() => selectLibrarian(lib)}
                    style={{
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      border: `1px solid ${selectedLib?._id === lib._id ? "var(--accent-blue)" : "var(--border)"}`,
                      background:
                        selectedLib?._id === lib._id
                          ? "rgba(59,130,246,0.08)"
                          : "var(--bg-input)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        background: "var(--accent-blue)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {lib.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                        {lib.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-secondary)",
                        }}
                      ></div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginTop: "0.15rem",
                        }}
                      >
                        Works:{" "}
                        {DAY_KEYS.filter((k) => lib.workingHours?.[k]?.enabled)
                          .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
                          .join(", ")}
                      </div>
                    </div>
                    {selectedLib?._id === lib._id && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "var(--accent-blue)",
                          fontSize: "1.1rem",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2–5: date, time, topic, notes (only shown after picking a librarian) */}
          {selectedLib && (
            <form onSubmit={handleSubmit}>
              {/* Date */}
              <div className="form-group">
                <label className="form-label">
                  Preferred Date <span style={{ color: "#f87171" }}>*</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      marginLeft: "0.4rem",
                    }}
                  >
                    ({selectedLib.name} works:{" "}
                    {DAY_KEYS.filter(
                      (k) => selectedLib.workingHours?.[k]?.enabled,
                    )
                      .map((k) => k.charAt(0).toUpperCase() + k.slice(1, 3))
                      .join(", ")}
                    )
                  </span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  min={minDate}
                  max={maxDate}
                  onChange={handleDateChange}
                  required
                />
              </div>

              {/* Time slots */}
              {form.date && (
                <div className="form-group">
                  <label className="form-label">
                    Available Time Slots{" "}
                    <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  {timeSlots.length === 0 ? (
                    <p
                      style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                    >
                      No time slots available on this date (all taken or
                      non-working day).
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "0.5rem",
                      }}
                    >
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`btn btn-sm ${form.time === slot ? "btn-primary" : "btn-secondary"}`}
                          onClick={() => setForm((p) => ({ ...p, time: slot }))}
                        >
                          {fmt12(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Topic */}
              <div className="form-group">
                <label className="form-label">
                  Topic <span style={{ color: "#f87171" }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={form.topic}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, topic: e.target.value }))
                  }
                  required
                >
                  <option value="">Select a topic…</option>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">
                  Additional Notes{" "}
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 400,
                      color: "var(--text-muted)",
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Describe what you need help with…"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={submitting || !form.time}
              >
                {submitting ? "⏳ Submitting…" : "📨 Submit Request"}
              </button>
            </form>
          )}
        </div>

        {/* ── RIGHT: My Meeting Requests ─────────────────────────────────── */}
        <div className="card">
          <div className="card-title">📋 My Meeting Requests</div>
          {loadingMtgs ? (
            <div className="spinner" />
          ) : meetings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗓</div>
              <div className="empty-state-text">No meeting requests yet.</div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {meetings.map((m) => (
                <div
                  key={m._id}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                      {m.topic}
                    </span>
                    <span
                      className={`badge ${STATUS_CLS[m.status] || "badge-pending"}`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    👤 {m.librarian?.name || "—"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    📅 {fmtDate(m.requestedDate)} &nbsp;⏰{" "}
                    {fmt12(m.preferredTime)}
                  </div>
                  {m.librarianNote && (
                    <div
                      style={{
                        fontSize: "0.73rem",
                        color: "var(--accent-blue)",
                        marginTop: "0.2rem",
                      }}
                    >
                      💬 {m.librarianNote}
                    </div>
                  )}
                  {m.status === "pending" && (
                    <button
                      className="btn btn-sm"
                      onClick={() => cancelMeeting(m._id)}
                      style={{
                        marginTop: "0.3rem",
                        alignSelf: "flex-start",
                        background: "rgba(239,68,68,0.08)",
                        color: "#f87171",
                        border: "1px solid rgba(248,113,113,0.2)",
                        padding: "0.25rem 0.6rem",
                        fontSize: "0.73rem",
                      }}
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulingPage;
