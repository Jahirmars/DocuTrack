import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/auth-context";

export default function PrivateRoute({ children, requiredRole }) {
  const { user } = useContext(AuthContext);

  // Si no hay sesión activa
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico y no coincide
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}