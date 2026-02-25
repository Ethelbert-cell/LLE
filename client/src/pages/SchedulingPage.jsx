import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const TODAY = new Date().toISOString().split("T")[0];

const TOPICS = [
  "Research Assistance",
  "Citation & Referencing Help",
  "Database Access",
  "Thesis Support",
  "Book Recommendation",
  "Workshop Registration",
  "Other",
];

const SchedulingPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    date: "",
    time: "",
    topic: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: replace with POST /api/meetings
    await new Promise((r) => setTimeout(r, 900));
    setSubmitted(true);
    showAlert(
      "alert-success",
      "✅ Meeting request submitted! A librarian will review and confirm shortly.",
    );
    setLoading(false);
  };

  // Mock history
  const MOCK_MEETINGS = [
    {
      _id: "m1",
      date: "2026-02-20",
      time: "10:00",
      topic: "Research Assistance",
      status: "approved",
    },
    {
      _id: "m2",
      date: "2026-02-28",
      time: "14:00",
      topic: "Thesis Support",
      status: "pending",
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Librarian Scheduling</h1>
        <p className="page-subtitle">
          Book a one-on-one consultation with our subject librarians.
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
        {/* Request Form */}
        <div className="card">
          <div className="card-title">📝 New Meeting Request</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Preferred Date</label>
              <input
                type="date"
                name="date"
                className="form-input"
                value={form.date}
                min={TODAY}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Time</label>
              <input
                type="time"
                name="time"
                className="form-input"
                value={form.time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Topic</label>
              <select
                name="topic"
                className="form-select"
                value={form.topic}
                onChange={handleChange}
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
            <div className="form-group">
              <label className="form-label">Additional Notes (optional)</label>
              <textarea
                name="notes"
                className="form-textarea"
                value={form.notes}
                onChange={handleChange}
                placeholder="Describe your question or what you need help with…"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "⏳ Submitting…" : "📨 Submit Request"}
            </button>
          </form>
        </div>

        {/* Upcoming Meetings */}
        <div className="card">
          <div className="card-title">📋 My Meeting Requests</div>
          {MOCK_MEETINGS.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗓</div>
              <div className="empty-state-text">No meeting requests yet.</div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              {MOCK_MEETINGS.map((m) => (
                <div
                  key={m._id}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
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
                    <span className={`badge badge-${m.status}`}>
                      {m.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    📅 {m.date} &nbsp;⏰ {m.time}
                  </div>
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
