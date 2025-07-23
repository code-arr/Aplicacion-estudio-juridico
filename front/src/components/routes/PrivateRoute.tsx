import { useAuthStore } from "@/store/useAuthStore";
import type { JSX } from "react";
import { Navigate } from "react-router-dom";

type PrivateRouteProps = {
  children: JSX.Element;
};

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isLoggedIn } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default PrivateRoute;
