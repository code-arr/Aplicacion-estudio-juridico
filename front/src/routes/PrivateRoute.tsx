import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "react-router-dom";
import type { JSX } from "react";
import LoadingScreen from "@components/shared/LoadingScreen";

type PrivateRouteProps = {
  children: JSX.Element;
  requiredRole?: "admin" | "lawyer";
};

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { isLoggedIn, isLoadingSession, user } = useAuthStore();

  // Si todavía se está restaurando la sesión, mostramos pantalla de carga
  if (isLoadingSession) return <LoadingScreen />;

  // Si no hay sesión activa, redirigimos al login
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // Si hay una restricción de rol y el usuario no la cumple, redirigimos a Unauthorized
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
