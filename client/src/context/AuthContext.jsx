import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage (real JWT only — not mock tokens)
    try {
      const stored = localStorage.getItem("lle_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed.token !== "mock-jwt-token") {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem("lle_user");
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
