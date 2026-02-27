const AdminSystemSettings = () => (
  <div className="page-container">
    <div className="page-header">
      <h1 className="page-title">System Settings</h1>
      <div
        style={{
          height: 3,
          width: 60,
          background: "var(--accent-blue)",
          margin: "0.5rem 0",
        }}
      />
      <p className="page-subtitle">Configure system-wide library settings.</p>
    </div>
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {[
        { label: "Library Name", value: "University Central Library" },
        { label: "Support Email", value: "library@university.edu" },
        { label: "Max Booking Duration (hours)", value: "4" },
        { label: "Max Advance Booking (days)", value: "7" },
        { label: "Librarian Access Code", value: "ADMIN2026" },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                marginTop: "0.2rem",
              }}
            >
              {value}
            </div>
          </div>
          <button className="btn btn-sm btn-secondary">Edit</button>
        </div>
      ))}
    </div>
  </div>
);

export default AdminSystemSettings;
