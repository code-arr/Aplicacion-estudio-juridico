import { Route, Routes } from "react-router-dom";
import LoginPage from "@pages/LoginPage";
import DashboardRouter from "./DashboardRouter.tsx";
import { useEffect } from "react";
import { isTokenExpired } from "@/utils/token.ts";
import { useAuthStore } from "@/store/useAuthStore.ts";
import PrivateRoute from "@components/routes/PrivateRoute.tsx";
import { jwtDecode } from "jwt-decode";
import InactivityModal from "@components/InactivityModal.tsx";

function AppRoutes() {
  const { token, reset } = useAuthStore();

  useEffect(() => {
    let timeoutId: number;

    if (token) {
      try {
        const decoded = jwtDecode<{ exp: number }>(token);
        const expirationTime = decoded.exp * 1000;
        const now = Date.now();
        const timeLeft = expirationTime - now;

        if (timeLeft <= 0 || isTokenExpired(token)) {
          reset();
        } else {
          timeoutId = window.setTimeout(() => {
            console.warn("Token expirado. Logout automático.");
            reset();
          }, timeLeft);
        }
      } catch (error) {
        console.error("Token inválido");
        reset();
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [token, reset]);

  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <DashboardRouter />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<p>Página no encontrada</p>} />
      </Routes>

      <InactivityModal />
    </div>
  );
}

export default AppRoutes;
