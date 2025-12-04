// src/routes/AppRoutes.tsx
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import PrivateRoute from "@/routes/PrivateRoute";
import { useAuthStore } from "@/store/useAuthStore";
import { useOAuthDeepLink } from "@/hooks/useOAuthDeepLink";
import { useResetDeepLink } from "@/hooks/useResetDeepLink";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import LawyerLayout from "@/layouts/LawyerLayout";

// Pages Auth / Public
import LoginPage from "@/pages/auth/LoginPage";
import UnauthorizedAccess from "@/pages/auth/UnauthorizedAccess";
import NotFoundPage from "@/pages/not-found/NotFoundPage";
import ResetPassword from "@/pages/auth/ResetPassword";
import LoadingScreen from "@/components/shared/LoadingScreen";

// Viewers (Protected standalone)
import DocumentViewerPage from "@/pages/dashboard/documents/DocumentViewerPage";
import AudienceViewerPage from "@/pages/dashboard/audiences/AudienceViewerPage";

// Lawyer Pages
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

// Admin Pages
import AdminClientsPage from "@/pages/dashboard/admin/AdminClientsPage";
import AdminLawyersPage from "@/pages/dashboard/admin/AdminLawyersPage";
import AdminStatsPage from "@/pages/dashboard/admin/AdminStatsPage";
import AdminItemsPage from "@/pages/dashboard/admin/AdminItemsPage";

const AppRoutes = () => {
  useResetDeepLink();
  useOAuthDeepLink();
  const { isAdmin, isLawyer, isLoadingSession } = useAuthStore();
  const location = useLocation();

  if (isLoadingSession) return <LoadingScreen />;

  return (
    <Routes>
      {/* === RUTAS PÚBLICAS === */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<UnauthorizedAccess />} />

      {/* === VIEWERS (Pantalla completa protegida) === */}
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

      {/* === RUTAS DE ADMIN (Usa AdminLayout) === */}
      {isAdmin && (
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="clients" replace />} />
          <Route path="clients" element={<AdminClientsPage />} />
          <Route path="lawyers" element={<AdminLawyersPage />} />
          <Route path="clientItems" element={<AdminItemsPage />} />
          <Route path="stats" element={<AdminStatsPage />} />
        </Route>
      )}

      {/* === RUTAS DE ABOGADO (Usa LawyerLayout) === */}
      {isLawyer && (
        <Route
          path="/dashboard"
          element={
            <PrivateRoute requiredRole="lawyer">
              <LawyerLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="clients" replace />} />

          <Route path="clients" element={<ClientsPage />} />

          {/* Subrutas de Cliente (ClientLayout maneja su propio sidebar interno o tabs si tenés) */}
          <Route path="clients/:clientId" element={<ClientLayout />}>
            <Route index element={<ClientOverviewPage />} />
            <Route
              path="category/:categoryId"
              element={<ClientCatalogPage />}
            />
          </Route>

          <Route path="clientItems" element={<ItemsPage />} />

          {/* Subrutas de Item */}
          <Route path="item/:clientItemId" element={<ItemLayout />}>
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
          <Route path="settings/edit-profile" element={<LawyerEditProfile />} />
        </Route>
      )}

      {/* === FALLBACKS (Si intentan entrar cruzado) === */}
      {/* Si un lawyer intenta entrar a /dashboard/admin -> Unauthorized */}
      {!isAdmin && (
        <Route path="/dashboard/admin/*" element={<UnauthorizedAccess />} />
      )}

      {/* Si un admin intenta entrar a rutas de lawyer -> redirige a su home */}
      {isAdmin && !isLawyer && (
        <Route
          path="/dashboard/*"
          element={<Navigate to="/dashboard/admin" replace />}
        />
      )}

      {/* 404 Universal */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
