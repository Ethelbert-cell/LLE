import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const AdminManageSchedule = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${user?.token}` };

  useEffect(() => {
    axios
      .get("/api/meetings", { headers })
      .then((r) => setMeetings(r.data))
      .catch(() =>
        setMeetings([
          {
            _id: 1,
            student: { name: "Alex Morgan" },
            topic: "Research Help",
            requestedDate: new Date().toISOString(),
            status: "pending",
          },
          {
            _id: 2,
            student: { name: "James Carter" },
            topic: "Referencing",
            requestedDate: new Date().toISOString(),
            status: "approved",
          },
        ]),
      )
      .finally(() => setLoading(false));
  }, []);

  const handle = async (id, action) => {
    try {
      const res = await axios.put(
        `/api/meetings/${id}/${action}`,
        {},
        { headers },
      );
      setMeetings((p) => p.map((m) => (m._id === id ? res.data : m)));
    } catch {}
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  const statusMap = {
    pending: "badge-pending",
    approved: "badge-approved",
    rejected: "badge-cancelled",
  };

  return (
    <div className="page-container">
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
          Review and approve/reject librarian meeting requests.
        </p>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <table className="bookings-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "1.5rem" }}>Student</th>
                <th>Topic</th>
                <th>Requested Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m._id}>
                  <td style={{ paddingLeft: "1.5rem", fontWeight: 500 }}>
                    {m.student?.name || "—"}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{m.topic}</td>
                  <td
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {formatDate(m.requestedDate)}
                  </td>
                  <td>
                    <span
                      className={`badge ${statusMap[m.status] || "badge-pending"}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td>
                    {m.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handle(m._id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handle(m._id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {m.status !== "pending" && (
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.78rem",
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!meetings.length && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No requests found.
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

export default AdminManageSchedule;
