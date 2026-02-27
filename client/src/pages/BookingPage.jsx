import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─── Library Hours by Day-of-Week ────────────────────────────────────────────
const LIBRARY_HOURS = {
  0: { open: "12:00", close: "18:00", label: "Sunday: 12:00 PM – 6:00 PM" },
  1: { open: "08:00", close: "22:00", label: "Mon – Fri: 8:00 AM – 10:00 PM" },
  2: { open: "08:00", close: "22:00", label: "Mon – Fri: 8:00 AM – 10:00 PM" },
  3: { open: "08:00", close: "22:00", label: "Mon – Fri: 8:00 AM – 10:00 PM" },
  4: { open: "08:00", close: "22:00", label: "Mon – Fri: 8:00 AM – 10:00 PM" },
  5: { open: "08:00", close: "22:00", label: "Mon – Fri: 8:00 AM – 10:00 PM" },
  6: { open: "09:00", close: "18:00", label: "Saturday: 9:00 AM – 6:00 PM" },
};

const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};
const getMaxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};
const dayOfWeek = (dateStr) => new Date(dateStr + "T12:00:00").getDay();
const TOMORROW = getTomorrow();
const MAX_DATE = getMaxDate();

// Convert "HH:MM" → "X:MM AM/PM"
const fmt12 = (t) => {
  if (!t) return t;
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
};

// Given a room's booked slots for a date, determine if it's currently taken
// and when it will next be free (considering the selected startTime/endTime filter)
const getRoomAvailability = (slots, selectedStart, selectedEnd) => {
  if (!slots || slots.length === 0) return { taken: false };

  // Check if ANY confirmed/pending slot overlaps the selected window
  // If no time selected yet, just check if there's any booking today
  for (const s of slots) {
    const overlaps =
      selectedStart && selectedEnd
        ? s.startTime < selectedEnd && s.endTime > selectedStart
        : true; // no time selected — show all booked slots as info

    if (overlaps) {
      return { taken: true, availableAt: s.endTime };
    }
  }
  return { taken: false };
};

const BookingPage = () => {
  const { user } = useAuth();

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  // roomSlots: { [roomId]: [{startTime, endTime, status}] } for the selected date
  const [roomSlots, setRoomSlots] = useState({});

  // ── My existing bookings (for student self-overlap check) ──────────────────
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    axios
      .get("/api/rooms")
      .then((r) => setRooms(r.data))
      .catch(() =>
        setRoomsError("Could not load rooms. Please try again later."),
      )
      .finally(() => setRoomsLoading(false));

    if (user?.token) {
      axios
        .get("/api/bookings/my", {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        .then((r) =>
          setMyBookings(r.data.filter((b) => b.status !== "cancelled")),
        )
        .catch(() => {});
    }
  }, [user]);

  // ── Booking form ─────────────────────────────────────────────────────────
  // IMPORTANT: form must be declared BEFORE any useEffect that reads form.date
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState({
    date: TOMORROW,
    startTime: "",
    endTime: "",
    purpose: "",
  });

  // Fetch booked slots whenever the selected date changes
  useEffect(() => {
    if (!form.date) return;
    axios
      .get(`/api/bookings/slots?date=${form.date}`)
      .then((r) => setRoomSlots(r.data))
      .catch(() => setRoomSlots({}));
  }, [form.date]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  // Library hours for the selected date
  const hours = useMemo(() => {
    if (!form.date) return LIBRARY_HOURS[1]; // default Mon–Fri
    return LIBRARY_HOURS[dayOfWeek(form.date)];
  }, [form.date]);

  // Check if student already has a booking overlapping the chosen slot
  const selfOverlaps = useMemo(() => {
    if (!form.date || !form.startTime || !form.endTime) return false;
    return myBookings.some(
      (b) =>
        b.date === form.date &&
        b.startTime < form.endTime &&
        b.endTime > form.startTime,
    );
  }, [form, myBookings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // When date changes, clear times so stale values don't slip through
      if (name === "date") next.startTime = "";
      // Auto-fix: if new startTime >= current endTime, clear endTime
      if (name === "startTime" && prev.endTime && value >= prev.endTime)
        next.endTime = "";
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom)
      return showAlert("alert-error", "Please select a room first.");
    if (!form.startTime || !form.endTime)
      return showAlert("alert-error", "Please fill in start and end times.");
    if (form.startTime >= form.endTime)
      return showAlert("alert-error", "End time must be after start time.");
    if (form.startTime < hours.open)
      return showAlert(
        "alert-error",
        `Library opens at ${hours.open} on this day.`,
      );
    if (form.endTime > hours.close)
      return showAlert(
        "alert-error",
        `Library closes at ${hours.close} on this day.`,
      );
    if (selfOverlaps)
      return showAlert(
        "alert-error",
        "You already have a booking that overlaps this time slot.",
      );

    setLoading(true);
    try {
      const res = await axios.post(
        "/api/bookings",
        {
          room: selectedRoom._id,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          purpose: form.purpose,
        },
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );

      // Add new booking to local list so self-overlap check updates immediately
      setMyBookings((prev) => [...prev, res.data]);
      showAlert(
        "alert-success",
        `✅ "${selectedRoom.name}" booked for ${form.date} from ${form.startTime} to ${form.endTime}.`,
      );
      setSelectedRoom(null);
      setForm({ date: TOMORROW, startTime: "", endTime: "", purpose: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Booking failed. Please try again.";
      showAlert("alert-error", `⛔ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Study Room Booking</h1>
        <p className="page-subtitle">
          Select a room and choose your time slot. Reservations open from the
          next day onward.
        </p>
      </div>

      {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

      {/* ── Room Grid ─────────────────────────────────────────────────────── */}
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
          <div className="empty-state-text">No rooms available right now.</div>
        </div>
      )}

      {!roomsLoading && rooms.length > 0 && (
        <div className="rooms-grid">
          {rooms.map((room) => {
            const avail = getRoomAvailability(
              roomSlots[room._id],
              form.startTime,
              form.endTime,
            );
            const isTaken = avail.taken;
            const isSelected = selectedRoom?._id === room._id;

            return (
              <div
                key={room._id}
                className={`room-card${isSelected ? " selected" : ""}`}
                onClick={() => !isTaken && setSelectedRoom(room)}
                role={isTaken ? "presentation" : "button"}
                tabIndex={isTaken ? -1 : 0}
                onKeyDown={(e) =>
                  !isTaken && e.key === "Enter" && setSelectedRoom(room)
                }
                style={{
                  position: "relative",
                  ...(isTaken ? { opacity: 0.6, cursor: "not-allowed" } : {}),
                }}
              >
                {/* Taken overlay */}
                {isTaken && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(10,12,18,0.72)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(2px)",
                      zIndex: 2,
                      gap: "0.25rem",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>🔒</span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: "#f87171",
                      }}
                    >
                      {room.name} is Taken
                    </span>
                    {avail.availableAt && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Available at {fmt12(avail.availableAt)}
                      </span>
                    )}
                  </div>
                )}

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
            );
          })}
        </div>
      )}

      {/* ── Booking Form ──────────────────────────────────────────────────── */}
      {selectedRoom && (
        <div className="card" style={{ maxWidth: 540, animationDelay: "0.1s" }}>
          <div className="card-title">
            📅 Book —{" "}
            <span style={{ color: "var(--accent-blue)" }}>
              {selectedRoom.name}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Date */}
            <div className="form-group">
              <label className="form-label">
                Date
                <span
                  style={{
                    fontSize: "0.71rem",
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginLeft: "0.5rem",
                  }}
                >
                  (bookings from tomorrow onwards — up to 7 days ahead)
                </span>
              </label>
              <input
                type="date"
                name="date"
                className="form-input"
                value={form.date}
                min={TOMORROW}
                max={MAX_DATE}
                onChange={handleChange}
                required
              />
            </div>

            {/* Library hours hint */}
            <div
              style={{
                background: "rgba(59,130,246,0.07)",
                border: "1px solid rgba(59,130,246,0.2)",
                padding: "0.55rem 0.85rem",
                fontSize: "0.76rem",
                color: "var(--accent-blue)",
                marginBottom: "1rem",
              }}
            >
              🕐 {hours.label}
            </div>

            {/* Times */}
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
                  min={hours.open}
                  max={hours.close}
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
                  min={form.startTime || hours.open}
                  max={hours.close}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Student self-overlap warning */}
            {selfOverlaps && (
              <div
                className="alert alert-error"
                style={{ marginBottom: "0.75rem", fontSize: "0.8rem" }}
              >
                ⚠️ You already have another booking during this time slot.
              </div>
            )}

            {/* Purpose */}
            <div className="form-group">
              <label className="form-label">
                Purpose
                <span
                  style={{
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    fontSize: "0.72rem",
                    marginLeft: "0.4rem",
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
                disabled={loading || selfOverlaps}
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
