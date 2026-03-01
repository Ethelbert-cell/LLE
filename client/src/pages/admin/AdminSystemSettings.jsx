import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

// System-wide editable fields
const SYSTEM_FIELDS = [
  {
    key: "maxBookingDuration",
    label: "Max Booking Duration (hours)",
    type: "number",
    min: 1,
    max: 12,
    hint: "Max hours a student can book a study room in one reservation.",
  },
  {
    key: "maxAdvanceDays",
    label: "Max Advance Booking (days)",
    type: "number",
    min: 1,
    max: 60,
    hint: "How many days ahead students can make room or meeting bookings.",
  },
  {
    key: "libraryName",
    label: "Library Name",
    type: "text",
    hint: "Display name shown in the student portal.",
  },
  {
    key: "supportEmail",
    label: "Support Email",
    type: "email",
    hint: "Contact email shown to students.",
  },
  {
    key: "librarianCode",
    label: "Librarian Access Code",
    type: "text",
    hint: "Required when registering as a librarian or admin.",
  },
  {
    key: "studentCode",
    label: "Student Access Code",
    type: "text",
    hint: "Required when registering as a student.",
  },
];

// ─── Sub-component: Librarian Card ───────────────────────────────────────────
const LibrarianCard = ({ lib, headers, onUpdate }) => {
  const [hours, setHours] = useState(() =>
    JSON.parse(JSON.stringify(lib.workingHours || {})),
  );
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateHour = (day, field, value) =>
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const saveHours = async () => {
    setSaving(true);
    try {
      const res = await axios.put(
        `/api/users/librarians/${lib._id}/hours`,
        { workingHours: hours },
        { headers },
      );
      onUpdate(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await axios.patch(
        `/api/users/librarians/${lib._id}/availability`,
        { isAvailable: !lib.isAvailable },
        { headers },
      );
      onUpdate(res.data);
    } catch {}
    setToggling(false);
  };

  return (
    <div className="card" style={{ marginBottom: "0.1rem" }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{lib.name}</div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginTop: "0.15rem",
            }}
          >
            {lib.email}
          </div>
        </div>

        {/* Availability toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: lib.isAvailable ? "#4ade80" : "#f87171",
              }}
            >
              {lib.isAvailable ? "🟢 Available" : "🔴 Unavailable"}
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                marginTop: "0.1rem",
              }}
            >
              {lib.isAvailable ? "Visible to students" : "Hidden from students"}
            </div>
          </div>

          {/* Slider-style toggle */}
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            title={
              lib.isAvailable
                ? "Click to set unavailable"
                : "Click to set available"
            }
            style={{
              width: 52,
              height: 28,
              borderRadius: 14,
              border: "none",
              cursor: toggling ? "wait" : "pointer",
              background: lib.isAvailable
                ? "var(--accent-blue)"
                : "rgba(239,68,68,0.3)",
              position: "relative",
              transition: "background 0.25s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: lib.isAvailable ? 26 : 3,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.25s",
                display: "block",
              }}
            />
          </button>
        </div>
      </div>

      {/* Working hours grid */}
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Working Hours
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: "0.6rem",
        }}
      >
        {DAY_KEYS.map((dk) => {
          const dh = hours[dk] || {};
          return (
            <div
              key={dk}
              style={{
                background: dh.enabled
                  ? "rgba(59,130,246,0.06)"
                  : "var(--bg-input)",
                border: `1px solid ${dh.enabled ? "rgba(59,130,246,0.2)" : "var(--border)"}`,
                padding: "0.7rem 0.85rem",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    color: dh.enabled
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  }}
                >
                  {DAY_LABELS[dk]}
                </span>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    color: dh.enabled
                      ? "var(--accent-blue)"
                      : "var(--text-muted)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!dh.enabled}
                    onChange={(e) =>
                      updateHour(dk, "enabled", e.target.checked)
                    }
                    style={{ accentColor: "var(--accent-blue)" }}
                  />
                  {dh.enabled ? "Active" : "Off"}
                </label>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.4rem",
                  opacity: dh.enabled ? 1 : 0.38,
                  pointerEvents: dh.enabled ? "auto" : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.63rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.15rem",
                    }}
                  >
                    Opens
                  </div>
                  <input
                    type="time"
                    className="form-input"
                    style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem" }}
                    value={dh.open || "09:00"}
                    onChange={(e) => updateHour(dk, "open", e.target.value)}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.63rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.15rem",
                    }}
                  >
                    Closes
                  </div>
                  <input
                    type="time"
                    className="form-input"
                    style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem" }}
                    value={dh.close || "17:00"}
                    onChange={(e) => updateHour(dk, "close", e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        {saved && (
          <span style={{ fontSize: "0.78rem", color: "#4ade80" }}>✓ Saved</span>
        )}
        <button
          className="btn btn-primary btn-sm"
          onClick={saveHours}
          disabled={saving}
        >
          {saving ? "Saving…" : "💾 Save Working Hours"}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminSystemSettings = () => {
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user?.token}` };

  // Determine role FIRST — used in state initializers below
  const isLibrarian = user?.role === "librarian";
  const isAdmin = user?.role === "admin";

  // Librarians default to their own tab; admins default to system config
  const [tab, setTab] = useState(() => (isLibrarian ? "librarians" : "system"));
  const [settings, setSettings] = useState(null);
  const [librarians, setLibrarians] = useState([]);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(null);
  const [alert, setAlert] = useState(null);
  // Librarians don’t need system settings — skip that loading state
  const [loadingS, setLoadingS] = useState(!isLibrarian);
  const [loadingL, setLoadingL] = useState(true);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  // Fetch system settings
  useEffect(() => {
    axios
      .get("/api/settings")
      .then((r) => setSettings(r.data))
      .catch(() => showAlert("alert-error", "Could not load settings."))
      .finally(() => setLoadingS(false));
  }, []);

  // Fetch librarians when that tab is active
  const fetchLibrarians = useCallback(() => {
    setLoadingL(true);
    axios
      .get("/api/users/librarians/all", { headers })
      .then((r) => setLibrarians(r.data))
      .catch(() => setLibrarians([]))
      .finally(() => setLoadingL(false));
  }, [user]);

  useEffect(() => {
    // Fire on mount for librarians (tab is already 'librarians'), or when admin switches to it
    if (tab === "librarians" || isLibrarian) fetchLibrarians();
  }, [tab, fetchLibrarians]);

  const handleLibrarianUpdate = (updated) =>
    setLibrarians((prev) =>
      prev.map((l) => (l._id === updated._id ? updated : l)),
    );

  // System settings save
  const startEdit = (key) =>
    setEditing((prev) => ({ ...prev, [key]: settings[key] }));
  const cancelEdit = (key) =>
    setEditing((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });

  const saveField = async (key) => {
    setSaving(key);
    try {
      const res = await axios.put(
        "/api/settings",
        { [key]: editing[key] },
        { headers },
      );
      setSettings(res.data);
      cancelEdit(key);
      showAlert("alert-success", "✅ Settings updated.");
    } catch (err) {
      showAlert("alert-error", err?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1 className="page-title">
          {isLibrarian ? "My Availability & Schedule" : "System Settings"}
        </h1>
        <div
          style={{
            height: 3,
            width: 60,
            background: "var(--accent-blue)",
            margin: "0.5rem 0",
          }}
        />
        <p className="page-subtitle">
          {isLibrarian
            ? "Manage your availability status and working hours. Students can only see and book you when you are set to Available."
            : "Configure system-wide library rules and manage librarian availability."}
        </p>
      </div>

      {alert && (
        <div className={`alert ${alert.type}`} style={{ marginBottom: "1rem" }}>
          {alert.msg}
        </div>
      )}

      {/* Tab switcher — admins only */}
      {isAdmin && (
        <div
          style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem" }}
        >
          <button
            className={`btn ${tab === "system" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("system")}
          >
            ⚙️ System Configuration
          </button>
          <button
            className={`btn ${tab === "librarians" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("librarians")}
          >
            👤 Librarian Availability & Hours
          </button>
        </div>
      )}

      {/* ══ System Config Tab — Admin only ══════════════════════════════════ */}
      {tab === "system" && isAdmin && (
        <>
          <div
            style={{
              background: "rgba(59,130,246,0.07)",
              border: "1px solid rgba(59,130,246,0.2)",
              padding: "0.85rem 1.25rem",
              fontSize: "0.8rem",
              color: "var(--accent-blue)",
              marginBottom: "1.5rem",
            }}
          >
            ℹ️ <strong>Max Booking Duration</strong> and{" "}
            <strong>Max Advance Booking</strong> are enforced on both the
            student UI and backend API — changes take effect immediately.
          </div>

          {loadingS ? (
            <div className="spinner" />
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {settings &&
                SYSTEM_FIELDS.map(({ key, label, type, min, max, hint }) => {
                  const isEditing = key in editing;
                  const isSaving = saving === key;
                  return (
                    <div
                      key={key}
                      className="card"
                      style={{ padding: "1.25rem 1.5rem" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "1rem",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: "0.2rem",
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: "0.73rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {hint}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexShrink: 0,
                          }}
                        >
                          {isEditing ? (
                            <>
                              <input
                                type={type}
                                className="form-input"
                                style={{
                                  width: type === "number" ? 80 : 220,
                                  padding: "0.35rem 0.65rem",
                                  fontSize: "0.85rem",
                                }}
                                value={editing[key]}
                                min={min}
                                max={max}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    [key]:
                                      type === "number"
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  }))
                                }
                              />
                              <button
                                className="btn btn-sm btn-primary"
                                disabled={isSaving}
                                onClick={() => saveField(key)}
                              >
                                {isSaving ? "Saving…" : "Save"}
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => cancelEdit(key)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.9rem",
                                  color: "var(--accent-blue)",
                                  minWidth: 60,
                                  textAlign: "right",
                                }}
                              >
                                {settings[key]}
                                {key === "maxBookingDuration" && (
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 400,
                                      color: "var(--text-muted)",
                                      marginLeft: "0.25rem",
                                    }}
                                  >
                                    hr{settings[key] !== 1 ? "s" : ""}
                                  </span>
                                )}
                                {key === "maxAdvanceDays" && (
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 400,
                                      color: "var(--text-muted)",
                                      marginLeft: "0.25rem",
                                    }}
                                  >
                                    day{settings[key] !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </span>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => startEdit(key)}
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* ══ Librarian Availability Tab ══════════════════════════════════════════ */}
      {tab === "librarians" && (
        <>
          <div
            style={{
              background: "rgba(59,130,246,0.07)",
              border: "1px solid rgba(59,130,246,0.2)",
              padding: "0.85rem 1.25rem",
              fontSize: "0.8rem",
              color: "var(--accent-blue)",
              marginBottom: "1.5rem",
            }}
          >
            ℹ️ Toggle a librarian <strong>OFF</strong> to immediately hide them
            from the student scheduling page. Working hours control which dates
            and time slots students can select.
          </div>

          {loadingL ? (
            <div className="spinner" />
          ) : librarians.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <div className="empty-state-text">
                No librarians found. Run the seed script first.
              </div>
            </div>
          ) : (
            librarians.map((lib) => (
              <LibrarianCard
                key={lib._id}
                lib={lib}
                headers={headers}
                onUpdate={handleLibrarianUpdate}
              />
            ))
          )}
        </>
      )}
    </div>
  );
};

export default AdminSystemSettings;
