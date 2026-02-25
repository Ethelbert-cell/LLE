import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Mock user for development (remove when real auth is connected)
const MOCK_USER = {
  _id: "mock-001",
  name: "Alex Morgan",
  studentId: "482910",
  email: "alex.morgan@university.edu",
  role: "student",
  token: "mock-jwt-token",
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try localStorage first, fall back to mock user for dev
    try {
      const stored = localStorage.getItem("lle_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Development convenience: auto-login with mock user
        setUser(MOCK_USER);
        localStorage.setItem("lle_user", JSON.stringify(MOCK_USER));
      }
    } catch {
      setUser(MOCK_USER);
    }
    setLoading(false);
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
