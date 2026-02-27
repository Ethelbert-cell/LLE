const AdminLiveChatSessions = () => (
  <div className="page-container">
    <div className="page-header">
      <h1 className="page-title">Live Chat Sessions</h1>
      <div
        style={{
          height: 3,
          width: 60,
          background: "var(--accent-blue)",
          margin: "0.5rem 0",
        }}
      />
      <p className="page-subtitle">
        Monitor and respond to active student live chat sessions.
      </p>
    </div>
    <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💬</div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
        Chat Monitor
      </h3>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          maxWidth: 400,
          margin: "0 auto",
        }}
      >
        Real-time librarian chat console will appear here. Active student
        sessions are managed via Socket.IO.
      </p>
    </div>
  </div>
);

export default AdminLiveChatSessions;
