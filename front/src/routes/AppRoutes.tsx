import { Route, Routes, Navigate } from "react-router-dom";

import PrivateRoute from "@/routes/PrivateRoute";

import { useAuthStore } from "@/store/useAuthStore";

import ItemLayout from "@/layouts/ItemLayout";
import ClientLayout from "@/layouts/ClientLayout";

import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import LoginPage from "@/pages/auth/LoginPage";
import NotFoundPage from "@/pages/not-found/NotFoundPage";
import UnauthorizedAccess from "@/pages/auth/UnauthorizedAccess";
import AdminDashboard from "@pages/dashboard/admin/AdminDashboard";
import ClientsPage from "@pages/dashboard/clients/ClientsPage";
import ClientOverviewPage from "@/pages/dashboard/clients/ClientOverviewPage";
import ClientCatalogPage from "@pages/dashboard/clients/ClientCatalogPage";

import LawyerStatistics from "@pages/dashboard/lawyer/statistics/LawyerStatistics";
import LawyerSettings from "@pages/dashboard/lawyer/settings/LawyerSettings";
import LawyerEditProfile from "@pages/dashboard/lawyer/settings/LawyerEditProfile";

import ItemOverviewPage from "@pages/dashboard/items/ItemOverviewPage";
import ItemsPage from "@pages/dashboard/items/ItemsPage";
import ItemDocumentsPage from "@pages/dashboard/items/ItemDocumentsPage";
import ItemAudiencesPage from "@pages/dashboard/items/ItemAudiencesPage";
import ItemMeetingsPage from "@pages/dashboard/items/ItemMeetingsPage";
import ItemProcessPage from "@pages/dashboard/items/ItemProcessPage";
import DocumentViewerPage from "@/pages/dashboard/documents/DocumentViewerPage";

import LoadingScreen from "@components/shared/LoadingScreen";

const AppRoutes = () => {
  const { isAdmin, isLawyer, isLoadingSession } = useAuthStore();

  if (isLoadingSession) return <LoadingScreen />;

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedAccess />} />

      {/* Visor PDF top-level, protegido */}
      <Route
        path="/viewer"
        element={
          <PrivateRoute>
            <DocumentViewerPage />
          </PrivateRoute>
        }
      />

      {/* Rutas privadas */}
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {isLawyer && (
          <>
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:clientId" element={<ClientLayout />}>
              <Route index element={<ClientOverviewPage />} />
              <Route
                path="category/:categoryId"
                element={<ClientCatalogPage />}
              />
            </Route>

            <Route path="clientItems" element={<ItemsPage />} />
            <Route path="item/:clientItemId" element={<ItemLayout />}>
              <Route index element={<ItemOverviewPage />} />
              <Route path="documents" element={<ItemDocumentsPage />} />
              <Route path="audiences" element={<ItemAudiencesPage />} />
              <Route path="meetings" element={<ItemMeetingsPage />} />
              <Route path="process" element={<ItemProcessPage />} />
            </Route>

            <Route path="statistics" element={<LawyerStatistics />} />
            <Route path="settings" element={<LawyerSettings />} />
            <Route
              path="settings/edit-profile"
              element={<LawyerEditProfile />}
            />
            <Route index element={<Navigate to="clients" replace />} />
          </>
        )}

        {isAdmin && (
          <>
            <Route path="admin" element={<AdminDashboard />} />
            <Route index element={<Navigate to="admin" replace />} />
          </>
        )}

        {/* Manejo de rutas no válidas */}
        {!isAdmin && <Route path="admin" element={<UnauthorizedAccess />} />}
        {!isLawyer && <Route path="clients" element={<UnauthorizedAccess />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

//------------------------------------------------------

/* import { Route, Routes } from "react-router-dom";
import LoginPage from "@pages/auth/LoginPage.tsx";
import DashboardRouter from "./DashboardRouter.tsx";
import { useEffect } from "react";
import { isTokenExpired } from "@/utils/token.ts";
import PrivateRoute from "@/routes/PrivateRoute.tsx";
import { jwtDecode } from "jwt-decode";
import InactivityModal from "@components/InactivityModal.tsx";
import LoadingScreen from "@/components/LoadingScreen.tsx";
import ResetPassword from "@pages/auth/ResetPassword.tsx";

function AppRoutes() {
  const { token, reset, setShowInactivityModal, isLoadingSession } =
    useAuthStore();

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
        <Route path="/resetPassword" element={<ResetPassword />} />
      </Routes>

      <InactivityModal />
    </div>
  );
}

export default AppRoutes; */
