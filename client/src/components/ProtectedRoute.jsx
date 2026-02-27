import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Roles that use the admin dashboard
const ADMIN_ROLES = ["admin", "librarian"];

// Where to send a user home based on their role
const homeFor = (role) =>
  ADMIN_ROLES.includes(role) ? "/admin" : "/dashboard";

/**
 * ProtectedRoute — guards routes by:
 *   1. Not logged in → redirect to /auth
 *   2. Wrong role group → redirect to their own home
 *
 *  requiredRole="admin"   → allows both admin AND librarian roles
 *  requiredRole="student" → only allows students
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user || !user.token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    // "admin" guards also accept librarians (both are staff)
    const allowed =
      requiredRole === "admin"
        ? ADMIN_ROLES.includes(user.role)
        : user.role === requiredRole;

    if (!allowed) {
      return <Navigate to={homeFor(user.role)} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
