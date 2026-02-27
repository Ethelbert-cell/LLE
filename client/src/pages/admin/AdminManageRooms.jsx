import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const AdminManageRooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: "",
    amenities: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const headers = { Authorization: `Bearer ${user?.token}` };

  useEffect(() => {
    axios
      .get("/api/rooms")
      .then((r) => setRooms(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        amenities: form.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      };
      const res = await axios.post("/api/rooms", payload, { headers });
      setRooms((p) => [...p, res.data]);
      setForm({
        name: "",
        location: "",
        capacity: "",
        amenities: "",
        description: "",
      });
      setShowForm(false);
      setMsg({ type: "success", text: "Room added successfully!" });
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to add room.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleToggle = async (id, current) => {
    try {
      const res = await axios.put(
        `/api/rooms/${id}`,
        { isActive: !current },
        { headers },
      );
      setRooms((p) => p.map((r) => (r._id === id ? res.data : r)));
    } catch {}
  };

  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="page-title">Manage Study Rooms</h1>
          <div
            style={{
              height: 3,
              width: 60,
              background: "var(--accent-blue)",
              margin: "0.5rem 0",
            }}
          />
          <p className="page-subtitle">
            Add, edit and deactivate library study rooms.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((p) => !p)}
        >
          {showForm ? "Cancel" : "+ Add Room"}
        </button>
      </div>

      {msg && (
        <div
          className={`alert alert-${msg.type === "error" ? "error" : "success"}`}
        >
          {msg.text}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 className="card-title">New Room</h3>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label className="form-label">Room Name</label>
              <input
                className="form-input"
                required
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Study Room A"
              />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input
                className="form-input"
                required
                value={form.location}
                onChange={set("location")}
                placeholder="e.g. Floor 2 — East Wing"
              />
            </div>
            <div>
              <label className="form-label">Capacity</label>
              <input
                className="form-input"
                type="number"
                required
                min={1}
                value={form.capacity}
                onChange={set("capacity")}
                placeholder="e.g. 6"
              />
            </div>
            <div>
              <label className="form-label">Amenities (comma-separated)</label>
              <input
                className="form-input"
                value={form.amenities}
                onChange={set("amenities")}
                placeholder="Whiteboard, Projector"
              />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={form.description}
                onChange={set("description")}
                placeholder="Brief description"
              />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Add Room"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <table className="bookings-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "1.5rem" }}>Room</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r._id}>
                  <td style={{ paddingLeft: "1.5rem", fontWeight: 600 }}>
                    {r.name}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {r.location}
                  </td>
                  <td>{r.capacity} seats</td>
                  <td>
                    <span
                      className={`badge ${r.isActive ? "badge-approved" : "badge-cancelled"}`}
                    >
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleToggle(r._id, r.isActive)}
                    >
                      {r.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {!rooms.length && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No rooms found.
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

export default AdminManageRooms;
