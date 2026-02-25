import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Mock rooms data for UI development (replace with API call)
const MOCK_ROOMS = [
  {
    _id: "room-1",
    name: "Study Room A",
    location: "Floor 2 — East Wing",
    capacity: 6,
    amenities: ["Whiteboard", "Projector", "Power Outlets"],
    description: "Ideal for group study sessions.",
  },
  {
    _id: "room-2",
    name: "Quiet Pod 1",
    location: "Floor 1 — Silent Zone",
    capacity: 2,
    amenities: ["Power Outlets", "Soundproofed"],
    description: "Perfect for focused individual work.",
  },
  {
    _id: "room-3",
    name: "Collaboration Suite",
    location: "Floor 3 — North",
    capacity: 12,
    amenities: ["Whiteboard", "Smart TV", "Conference Phone", "Power Outlets"],
    description: "Large space for team projects.",
  },
  {
    _id: "room-4",
    name: "Reading Room B",
    location: "Floor 1 — West Wing",
    capacity: 4,
    amenities: ["Natural Lighting", "Power Outlets"],
    description: "Comfortable reading and research space.",
  },
];

const TODAY = new Date().toISOString().split("T")[0];

const BookingPage = () => {
  const { user } = useAuth();
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
    setTimeout(() => setAlert(null), 4000);
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
    // TODO: replace with API call: POST /api/bookings
    await new Promise((r) => setTimeout(r, 900));
    showAlert(
      "alert-success",
      `✅ Room "${selectedRoom.name}" booked for ${form.date} from ${form.startTime} to ${form.endTime}.`,
    );
    setSelectedRoom(null);
    setForm({ date: TODAY, startTime: "", endTime: "", purpose: "" });
    setLoading(false);
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

      {/* Room Selection */}
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
        Available Rooms
      </h2>
      <div className="rooms-grid">
        {MOCK_ROOMS.map((room) => (
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
            <div className="amenities">
              <div className="room-amenities">
                {room.amenities.map((a) => (
                  <span key={a} className="amenity-tag">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Form */}
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
              <label className="form-label">Purpose (optional)</label>
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
