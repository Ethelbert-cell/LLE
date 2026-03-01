import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const BookIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="10" y1="7" x2="16" y2="7" />
    <line x1="10" y1="11" x2="14" y2="11" />
  </svg>
);
const EyeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ROLES = [
  { id: "student", label: "Student" },
  { id: "admin", label: "Librarian" },
];

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [role, setRole] = useState("student"); // 'student' | 'admin'
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    studentCode: "",
    adminCode: "",
  });

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setError("");
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setForm({
      name: "",
      email: "",
      password: "",
      studentCode: "",
      adminCode: "",
    });
  };
  const switchRole = (r) => {
    setRole(r);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!form.email.trim() || !form.password.trim())
      return setError("Email and password are required.");
    if (mode === "signup" && !form.name.trim())
      return setError("Full name is required.");
    if (mode === "signup" && role === "admin" && !form.adminCode)
      return setError("Librarian access code is required.");
    if (mode === "signup" && role === "student" && !form.studentCode)
      return setError("Student access code is required.");

    setLoading(true);
    try {
      const endpoint =
        mode === "signin" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "signin"
          ? { email: form.email, password: form.password, role }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              role,
              accessCode:
                role === "student" ? form.studentCode : form.adminCode,
            };

      const res = await axios.post(endpoint, payload);
      login(res.data);

      // Redirect by role — both admin and librarian go to /admin
      const isStaff = ["admin", "librarian"].includes(res.data.role);
      navigate(isStaff ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        fontFamily: "inherit",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            marginBottom: "2rem",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              background: "var(--accent-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-blue)",
              flexShrink: 0,
            }}
          >
            <BookIcon />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "1.15rem",
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              Library
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-blue)",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              SUPPORT SYSTEM
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            padding: "2rem",
            boxShadow: "var(--shadow-card)",
            animation: "fadeUp 0.35s ease both",
          }}
        >
          {/* Role Toggle */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              marginBottom: "1.5rem",
              padding: "3px",
              gap: "3px",
            }}
          >
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => switchRole(r.id)}
                style={{
                  padding: "0.55rem",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  transition: "var(--transition)",
                  background:
                    role === r.id ? "var(--accent-blue)" : "transparent",
                  color: role === r.id ? "#fff" : "var(--text-secondary)",
                  boxShadow: role === r.id ? "var(--shadow-blue)" : "none",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Sign In / Sign Up Tabs */}
          <div
            style={{
              display: "flex",
              gap: "0",
              borderBottom: "1px solid var(--border)",
              marginBottom: "1.5rem",
            }}
          >
            {[
              ["signin", "Sign In"],
              ["signup", "Sign Up"],
            ].map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    mode === m
                      ? "2px solid var(--accent-blue)"
                      : "2px solid transparent",
                  color:
                    mode === m ? "var(--accent-blue)" : "var(--text-secondary)",
                  fontWeight: mode === m ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  fontFamily: "inherit",
                  marginBottom: "-1px",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "1.25rem" }}>
            <h1
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {mode === "signin" ? `Welcome back` : `Create your account`}
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                marginTop: "0.3rem",
              }}
            >
              {mode === "signin"
                ? `Sign in to your ${role === "admin" ? "librarian" : "student"} account`
                : `Register as a ${role === "admin" ? "librarian" : "student"}`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(248,113,113,0.25)",
                color: "#f87171",
                padding: "0.65rem 0.9rem",
                fontSize: "0.8rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}
          >
            {/* Name (sign up only) */}
            {mode === "signup" && (
              <div>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Alex Morgan"
                  value={form.name}
                  onChange={set("name")}
                  autoFocus
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={set("email")}
                autoFocus={mode === "signin"}
              />
            </div>

            {/* Student Code (student sign up only) */}
            {mode === "signup" && role === "student" && (
              <div>
                <label className="form-label">Student Access Code</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter student access code"
                  value={form.studentCode}
                  onChange={set("studentCode")}
                />
              </div>
            )}

            {/* Admin Code (admin sign up only) */}
            {mode === "signup" && role === "admin" && (
              <div>
                <label className="form-label">Librarian Access Code</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter access code"
                  value={form.adminCode}
                  onChange={set("adminCode")}
                />
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "0.3rem",
                  }}
                >
                  Contact your library administrator for this code.
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-input"
                  type={showPass ? "text" : "password"}
                  placeholder={
                    mode === "signup"
                      ? "Min. 6 characters"
                      : "Enter your password"
                  }
                  value={form.password}
                  onChange={set("password")}
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                marginTop: "0.25rem",
                padding: "0.75rem",
              }}
              disabled={loading}
            >
              {loading
                ? mode === "signin"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          {/* Switch mode */}
          <p
            style={{
              textAlign: "center",
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginTop: "1.25rem",
              marginBottom: 0,
            }}
          >
            {mode === "signin"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() =>
                switchMode(mode === "signin" ? "signup" : "signin")
              }
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-blue)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.78rem",
                fontFamily: "inherit",
              }}
            >
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            marginTop: "1.25rem",
          }}
        >
          University Library Learning Environment
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
