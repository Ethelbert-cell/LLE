import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check localStorage for a previously saved real session
        const stored = localStorage.getItem("lle_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only restore if it has a real token (not the old mock token)
          if (parsed?.token && parsed.token !== "mock-jwt-token") {
            setUser(parsed);
            setLoading(false);
            return;
          }
        }

        // 2. Auto-login with the seeded student account to get a real JWT
        //    (This keeps the dev experience seamless — replace with a login
        //     page flow once the full auth UI is built)
        const res = await axios.post("/api/auth/login", {
          email: "alex.morgan@university.edu",
          password: "student123",
        });

        const userData = res.data; // { _id, name, email, role, studentId, token }
        setUser(userData);
        localStorage.setItem("lle_user", JSON.stringify(userData));
      } catch (err) {
        console.warn("Auto-login failed:", err.message);
        // Fallback: show a minimal user without a token
        // The UI will still render; protected API calls will show auth errors
        setUser({
          name: "Student",
          role: "student",
          token: null,
        });
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("lle_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("lle_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
