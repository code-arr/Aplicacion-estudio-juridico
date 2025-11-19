// src/routes/AppRoutes.tsx
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import PrivateRoute from "@/routes/PrivateRoute";
import { useAuthStore } from "@/store/useAuthStore";

// Layouts y páginas
import DashboardLayout from "@/layouts/DashboardLayout";
import LoginPage from "@/pages/auth/LoginPage";
import UnauthorizedAccess from "@/pages/auth/UnauthorizedAccess";
import NotFoundPage from "@/pages/not-found/NotFoundPage";
import ResetPassword from "@/pages/auth/ResetPassword";

// Viewers
import DocumentViewerPage from "@/pages/dashboard/documents/DocumentViewerPage";
import AudienceViewerPage from "@/pages/dashboard/audiences/AudienceViewerPage";

// Lawyer (las tuyas existentes)
import ClientsPage from "@/pages/dashboard/clients/ClientsPage";
import ClientLayout from "@/layouts/ClientLayout";
import ClientOverviewPage from "@/pages/dashboard/clients/ClientOverviewPage";
import ClientCatalogPage from "@/pages/dashboard/clients/ClientCatalogPage";
import ItemsPage from "@/pages/dashboard/items/ItemsPage";
import ItemLayout from "@/layouts/ItemLayout";
import ItemDocumentsPage from "@/pages/dashboard/items/ItemDocumentsPage";
import ItemAudiencesPage from "@/pages/dashboard/items/ItemAudiencesPage";
import ItemMeetingsPage from "@/pages/dashboard/items/ItemMeetingsPage";
import ItemProcessPage from "@/pages/dashboard/items/ItemProcessPage";
import LawyerStatistics from "@/pages/dashboard/lawyer/statistics/LawyerStatistics";
import LawyerSettings from "@/pages/dashboard/lawyer/settings/LawyerSettings";
import LawyerEditProfile from "@/pages/dashboard/lawyer/settings/LawyerEditProfile";

// Admin (nuevas)
import AdminClientsPage from "@/pages/dashboard/admin/AdminClientsPage";
import AdminLawyersPage from "@/pages/dashboard/admin/AdminLawyersPage";
import AdminStatsPage from "@/pages/dashboard/admin/AdminStatsPage";

import LoadingScreen from "@/components/shared/LoadingScreen";
import AdminItemsPage from "@/pages/dashboard/admin/AdminItemsPage";
import { useOAuthDeepLink } from "@/hooks/useOAuthDeepLink";

const AppRoutes = () => {
  useOAuthDeepLink();
  const location = useLocation();
  const { isAdmin, isLawyer, isLoadingSession } = useAuthStore();
  if (isLoadingSession) return <LoadingScreen />;

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<UnauthorizedAccess />} />

      {/* Visor PDF top-level, protegido */}
      <Route
        path="/viewer/documents"
        element={
          <PrivateRoute>
            <DocumentViewerPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/viewer/audiences"
        element={
          <PrivateRoute>
            <AudienceViewerPage />
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
              {/* <Route index element={<ItemOverviewPage />} /> */}
              <Route
                index
                element={
                  <Navigate to="documents" replace state={location.state} />
                }
              />
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
            {/* Index admin => clients */}
            <Route index element={<Navigate to="admin/clients" replace />} />

            <Route
              path="admin/clients"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminClientsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="admin/lawyers"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminLawyersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="admin/clientItems"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminItemsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="admin/stats"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminStatsPage />
                </PrivateRoute>
              }
            />
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
