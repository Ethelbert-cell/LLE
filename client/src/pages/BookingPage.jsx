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

// Given a room's booked slots for a date, determine availability based on selected time window.
// Returns: { taken: bool, soft: bool, availableAt }
//   taken  = hard block — slot overlaps selected start/end exactly
//   soft   = informational — room has bookings on this date but no time selected yet
const getRoomAvailability = (slots, selectedStart, selectedEnd) => {
  if (!slots || slots.length === 0) return { taken: false, soft: false };

  // If no time selected yet, show a soft indicator (room has bookings, but not blocked)
  if (!selectedStart || !selectedEnd) {
    return { taken: false, soft: true };
  }

  // Time selected — only block if there is an actual overlap
  for (const s of slots) {
    if (s.startTime < selectedEnd && s.endTime > selectedStart) {
      return { taken: true, soft: false, availableAt: s.endTime };
    }
  }
  return { taken: false, soft: false };
};

const BookingPage = () => {
  const { user } = useAuth();

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  // roomSlots: { [roomId]: [{startTime, endTime, status}] } for the selected date
  const [roomSlots, setRoomSlots] = useState({});
  // System settings enforced on UI (maxAdvanceDays, maxBookingDuration)
  const [settings, setSettings] = useState({
    maxAdvanceDays: 7,
    maxBookingDuration: 4,
  });

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

    // Fetch system settings (maxAdvanceDays, maxBookingDuration)
    axios
      .get("/api/settings")
      .then((r) => setSettings(r.data))
      .catch(() => {});

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

  // Derive maxDate from live settings
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.maxAdvanceDays || 7));
    return d.toISOString().split("T")[0];
  }, [settings.maxAdvanceDays]);

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

  // ── Duration limit: endTime must not exceed startTime + maxBookingDuration hrs ─
  const maxEndTime = useMemo(() => {
    if (!form.startTime || !settings.maxBookingDuration) return "";
    const [h, m] = form.startTime.split(":").map(Number);
    const totalMins = h * 60 + m + settings.maxBookingDuration * 60;
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }, [form.startTime, settings.maxBookingDuration]);

  const durationExceeded = useMemo(() => {
    if (!form.startTime || !form.endTime || !settings.maxBookingDuration)
      return false;
    const toMins = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    return (
      toMins(form.endTime) - toMins(form.startTime) >
      settings.maxBookingDuration * 60
    );
  }, [form.startTime, form.endTime, settings.maxBookingDuration]);

  const alreadyBookedToday = useMemo(() => {
    if (!form.date) return false;
    return myBookings.some(
      (b) =>
        b.date === form.date && ["pending", "confirmed"].includes(b.status),
    );
  }, [form.date, myBookings]);

  // ── Weekly limit: max 2 bookings per calendar week (Mon–Sun) ────────────────
  const weeklyBookingCount = useMemo(() => {
    if (!form.date) return 0;
    const reqDate = new Date(form.date + "T12:00:00");
    const dow = reqDate.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const weekStart = new Date(reqDate);
    weekStart.setDate(reqDate.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const wStart = weekStart.toISOString().split("T")[0];
    const wEnd = weekEnd.toISOString().split("T")[0];
    return myBookings.filter(
      (b) =>
        ["pending", "confirmed"].includes(b.status) &&
        b.date >= wStart &&
        b.date <= wEnd,
    ).length;
  }, [form.date, myBookings]);

  const weeklyLimitHit = weeklyBookingCount >= 2;

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
    // Clear room slots IMMEDIATELY on date change so taken indicator
    // never shows stale data from the previous date while the new fetch loads.
    if (name === "date") setRoomSlots({});
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
    if (durationExceeded)
      return showAlert(
        "alert-error",
        `Maximum session is ${settings.maxBookingDuration} hour${settings.maxBookingDuration !== 1 ? "s" : ""}. Please shorten your booking.`,
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

      // Re-fetch room slots for the booked date so ALL rooms on that date
      // immediately show the "Partially Booked" indicator without needing
      // a manual date change to trigger the useEffect.
      const bookedDate = form.date;
      axios
        .get(`/api/bookings/slots?date=${bookedDate}`)
        .then((r) => setRoomSlots(r.data))
        .catch(() => {});

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
            const isSelected = selectedRoom?._id === room._id;

            return (
              <div
                key={room._id}
                className={`room-card${isSelected ? " selected" : ""}`}
                onClick={() => !avail.taken && setSelectedRoom(room)}
                role={avail.taken ? "presentation" : "button"}
                tabIndex={avail.taken ? -1 : 0}
                onKeyDown={(e) =>
                  !avail.taken && e.key === "Enter" && setSelectedRoom(room)
                }
                style={{
                  position: "relative",
                  ...(avail.taken
                    ? { opacity: 0.6, cursor: "not-allowed" }
                    : {}),
                }}
              >
                {/* Hard taken overlay — specific time slot conflict */}
                {avail.taken && (
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
                        Free from {fmt12(avail.availableAt)}
                      </span>
                    )}
                  </div>
                )}

                {/* Soft indicator — room has bookings on this date but no time-slot conflict yet */}
                {avail.soft && !avail.taken && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      margin: "0.6rem 0 0",
                      padding: "0.35rem 0.7rem",
                      background: "rgba(251,191,36,0.1)",
                      border: "1px solid rgba(251,191,36,0.3)",
                      borderRadius: 6,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#f59e0b",
                    }}
                  >
                    <span>🕐</span>
                    <span>
                      Partially booked — select a time to check availability
                    </span>
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
                  (tomorrow onwards · max {settings.maxAdvanceDays || 7} days ·
                  1/day · 2/week)
                </span>
              </label>
              <input
                type="date"
                name="date"
                className="form-input"
                value={form.date}
                min={TOMORROW}
                max={maxDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Daily limit warning */}
            {alreadyBookedToday && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  marginBottom: "1rem",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>🚫</span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      color: "#f87171",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Daily limit reached
                  </div>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.4,
                    }}
                  >
                    You already have a booking on{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {form.date}
                    </strong>
                    . Only{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      1 room per day
                    </strong>{" "}
                    is allowed — choose a different date.
                  </div>
                </div>
              </div>
            )}

            {/* Weekly limit warning */}
            {weeklyLimitHit && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  marginBottom: "1rem",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>📅</span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      color: "#f87171",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Weekly limit reached ({weeklyBookingCount}/2)
                  </div>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.4,
                    }}
                  >
                    You have used all{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      2 bookings
                    </strong>{" "}
                    for this week. Cancel an existing booking to make room for a
                    new one.
                  </div>
                </div>
              </div>
            )}

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
                  max={
                    maxEndTime
                      ? maxEndTime < hours.close
                        ? maxEndTime
                        : hours.close
                      : hours.close
                  }
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Duration limit warning */}
            {durationExceeded && (
              <div
                className="alert alert-error"
                style={{ marginBottom: "0.75rem", fontSize: "0.8rem" }}
              >
                ⚠️ Maximum session duration is{" "}
                <strong>
                  {settings.maxBookingDuration} hour
                  {settings.maxBookingDuration !== 1 ? "s" : ""}
                </strong>
                . Please shorten your booking window.
              </div>
            )}

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
                disabled={
                  loading ||
                  selfOverlaps ||
                  alreadyBookedToday ||
                  weeklyLimitHit ||
                  durationExceeded
                }
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
