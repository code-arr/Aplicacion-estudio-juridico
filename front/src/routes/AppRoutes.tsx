import { Route, Routes } from "react-router-dom";
import LoginPage from "@pages/LoginPage";
import DashboardRouter from "./DashboardRouter.tsx";
import { useEffect } from "react";
import { isTokenExpired } from "@/utils/token.ts";
import { restoreSession, useAuthStore } from "@/store/useAuthStore.ts";
import PrivateRoute from "@components/routes/PrivateRoute.tsx";
import { jwtDecode } from "jwt-decode";
import InactivityModal from "@components/InactivityModal.tsx";
import LoadingScreen from "@/components/LoadingScreen.tsx";

function AppRoutes() {
  const { token, reset, setShowInactivityModal, isLoadingSession } =
    useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    let timeoutId: number;

    if (token) {
      if (token === "veverv777777erge") {
        console.warn(
          "Token mock detectado: se omite validación de expiración."
        );
        return;
      }

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

  // Mostrar spinner o nada mientras carga
  if (isLoadingSession) return <LoadingScreen />;

  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <DashboardRouter />
            </PrivateRoute>
          }
        />
      </Routes>

      <InactivityModal />
    </div>
  );
}

export default AppRoutes;
