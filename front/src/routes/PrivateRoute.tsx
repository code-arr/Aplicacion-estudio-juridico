// src/routes/PrivateRoute.tsx
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate, useLocation } from "react-router-dom";
import type { JSX } from "react";
import LoadingScreen from "@/components/shared/LoadingScreen";

type PrivateRouteProps = {
  children: JSX.Element;
  requiredRole?: "admin" | "lawyer";
};

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const location = useLocation();
  const { isLoggedIn, isLoadingSession, user } = useAuthStore();

  // 1. Cargando sesión (recuperando token de localStorage, etc.)
  if (isLoadingSession) return <LoadingScreen />;

  // 2. No logueado -> Login (guardamos location para redirect post-login si querés implementarlo luego)
  if (!isLoggedIn) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. Rol incorrecto -> Unauthorized
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Pase libre
  return children;
};

export default PrivateRoute;
