import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const TODAY = new Date().toISOString().split("T")[0];

const MAX_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
})();

const BookingPage = () => {
  const { user } = useAuth();

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(null);

  useEffect(() => {
    // GET /api/rooms — public endpoint, returns only active rooms
    axios
      .get("/api/rooms")
      .then((res) => setRooms(res.data))
      .catch(() =>
        setRoomsError("Could not load rooms. Please try again later."),
      )
      .finally(() => setRoomsLoading(false));
  }, []);

  // ── Booking form ───────────────────────────────────────────────────────────
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState({
    date: TODAY,
    startTime: "",
    endTime: "",
    purpose: "",
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom)
      return showAlert("alert-error", "Please select a room first.");
    if (!form.startTime || !form.endTime)
      return showAlert("alert-error", "Please fill in start and end times.");
    if (form.startTime >= form.endTime)
      return showAlert("alert-error", "End time must be after start time.");

    setLoading(true);
    try {
      await axios.post(
        "/api/bookings",
        {
          room: selectedRoom._id,
          date: form.date, // "YYYY-MM-DD"
          startTime: form.startTime, // "HH:MM"
          endTime: form.endTime, // "HH:MM"
          purpose: form.purpose,
        },
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );

      showAlert(
        "alert-success",
        `✅ "${selectedRoom.name}" booked for ${form.date} from ${form.startTime} to ${form.endTime}.`,
      );
      setSelectedRoom(null);
      setForm({ date: TODAY, startTime: "", endTime: "", purpose: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Booking failed. Please try again.";
      // Handle double-booking gracefully
      if (
        msg.toLowerCase().includes("conflict") ||
        msg.toLowerCase().includes("overlap") ||
        msg.toLowerCase().includes("already")
      ) {
        showAlert(
          "alert-error",
          `⛔ That time slot is already booked. Please choose a different time.`,
        );
      } else {
        showAlert("alert-error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Study Room Booking</h1>
        <p className="page-subtitle">
          Select a room and choose your time slot to make a reservation.
        </p>
      </div>

      {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

      {/* ── Available Rooms ──────────────────────────────────────────────── */}
      <h2
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Available Rooms{" "}
        {!roomsLoading && rooms.length > 0 && (
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            ({rooms.length})
          </span>
        )}
      </h2>

      {roomsLoading && <div className="spinner" />}

      {roomsError && <div className="alert alert-error">{roomsError}</div>}

      {!roomsLoading && !roomsError && rooms.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🚪</div>
          <div className="empty-state-text">
            No study rooms available right now. Please check back later.
          </div>
        </div>
      )}

      {!roomsLoading && rooms.length > 0 && (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <div
              key={room._id}
              className={`room-card${selectedRoom?._id === room._id ? " selected" : ""}`}
              onClick={() => setSelectedRoom(room)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedRoom(room)}
            >
              <div className="room-card-header">
                <div>
                  <div className="room-card-name">{room.name}</div>
                  <div className="room-card-location">📍 {room.location}</div>
                </div>
                <div className="room-capacity-badge">👥 {room.capacity}</div>
              </div>
              {room.description && (
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
                    margin: "0.4rem 0 0.5rem",
                  }}
                >
                  {room.description}
                </p>
              )}
              <div className="room-amenities">
                {(room.amenities || []).map((a) => (
                  <span key={a} className="amenity-tag">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Booking Form ────────────────────────────────────────────────── */}
      {selectedRoom && (
        <div className="card" style={{ maxWidth: 520, animationDelay: "0.1s" }}>
          <div className="card-title">
            📅 Book —{" "}
            <span style={{ color: "var(--accent-blue)" }}>
              {selectedRoom.name}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                name="date"
                className="form-input"
                value={form.date}
                min={TODAY}
                max={MAX_DATE}
                onChange={handleChange}
                required
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  className="form-input"
                  value={form.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  className="form-input"
                  value={form.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                Purpose{" "}
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 400,
                    fontSize: "0.72rem",
                  }}
                >
                  (optional)
                </span>
              </label>
              <textarea
                name="purpose"
                className="form-textarea"
                value={form.purpose}
                onChange={handleChange}
                placeholder="e.g. Group project meeting, Research session…"
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "⏳ Booking…" : "✅ Confirm Booking"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedRoom(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
