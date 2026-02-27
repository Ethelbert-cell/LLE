import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — guards routes by:
 *   1. Not logged in → redirect to /auth
 *   2. Wrong role (e.g. student trying to access /admin) → redirect to their home
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While auth state is being resolved, render nothing
  if (loading) return null;

  // Not authenticated → go to auth page, preserving the intended destination
  if (!user || !user.token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Role guard: student can't access admin routes, admin can't access student routes
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />
    );
  }

  return children;
};

export default ProtectedRoute;
