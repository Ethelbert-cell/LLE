import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Mock data — replace with API calls to GET /api/bookings/my and GET /api/meetings/my
const MOCK_BOOKINGS = [
  {
    _id: "b1",
    room: { name: "Study Room A", location: "Floor 2" },
    date: "2026-02-26",
    startTime: "09:00",
    endTime: "11:00",
    status: "confirmed",
    purpose: "Group project",
  },
  {
    _id: "b2",
    room: { name: "Quiet Pod 1", location: "Floor 1" },
    date: "2026-02-28",
    startTime: "14:00",
    endTime: "16:00",
    status: "confirmed",
    purpose: "Research",
  },
  {
    _id: "b3",
    room: { name: "Study Room A", location: "Floor 2" },
    date: "2026-02-15",
    startTime: "10:00",
    endTime: "12:00",
    status: "cancelled",
    purpose: "",
  },
];

const MOCK_MEETINGS = [
  {
    _id: "m1",
    date: "2026-02-20",
    time: "10:00",
    topic: "Research Assistance",
    status: "approved",
    adminNote: "See you then!",
  },
  {
    _id: "m2",
    date: "2026-02-28",
    time: "14:00",
    topic: "Thesis Support",
    status: "pending",
    adminNote: "",
  },
  {
    _id: "m3",
    date: "2026-02-10",
    time: "11:00",
    topic: "Citation Help",
    status: "rejected",
    adminNote: "No slots available on this day.",
  },
];

const MyBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);

  const handleCancelBooking = (id) => {
    setBookings((prev) =>
      prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b)),
    );
    // TODO: DELETE /api/bookings/:id
  };

  const handleCancelMeeting = (id) => {
    setMeetings((prev) => prev.filter((m) => m._id !== id));
    // TODO: DELETE /api/meetings/:id
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">
          Manage all your room reservations and librarian appointments.
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          className={`btn ${tab === "bookings" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("bookings")}
        >
          🚪 Room Bookings (
          {bookings.filter((b) => b.status !== "cancelled").length})
        </button>
        <button
          className={`btn ${tab === "meetings" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("meetings")}
        >
          🗓 Meeting Requests ({meetings.length})
        </button>
      </div>

      {/* Room Bookings Tab */}
      {tab === "bookings" && (
        <div className="card">
          <div className="card-title">🚪 Room Reservations</div>
          {bookings.length === 0 ? (
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
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.room.name}</div>
                      <div
                        style={{
                          fontSize: "0.73rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {b.room.location}
                      </div>
                    </td>
                    <td>{b.date}</td>
                    <td>
                      {b.startTime} – {b.endTime}
                    </td>
                    <td
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {b.purpose || "—"}
                    </td>
                    <td>
                      <span className={`badge badge-${b.status}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {b.status !== "cancelled" ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelBooking(b._id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Meeting Requests Tab */}
      {tab === "meetings" && (
        <div className="card">
          <div className="card-title">🗓 Meeting Requests</div>
          {meetings.length === 0 ? (
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
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Librarian Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m._id}>
                    <td style={{ fontWeight: 600 }}>{m.topic}</td>
                    <td>
                      {m.date} ⏰ {m.time}
                    </td>
                    <td>
                      <span className={`badge badge-${m.status}`}>
                        {m.status}
                      </span>
                    </td>
                    <td
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {m.adminNote || "—"}
                    </td>
                    <td>
                      {m.status === "pending" ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelMeeting(m._id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
