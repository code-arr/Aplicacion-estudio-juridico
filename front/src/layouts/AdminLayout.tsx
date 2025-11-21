// src/layouts/AdminLayout.tsx
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import InactivityModal from "@/components/shared/InactivityModal";
import LoadingScreen from "@/components/shared/LoadingScreen";
import {
  useCatalogStore,
  selectIsCatalogHydrated,
  selectIsCatalogLoading,
} from "@/store/useCatalogStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTokenExpirationWatcher } from "@/hooks/useTokenExpirationWatcher";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

const AdminLayout = () => {
  // Seguridad básica de sesión (expiración e inactividad)
  useTokenExpirationWatcher();
  useInactivityLogout();

  // Carga del catálogo (Categorías, Secciones, Tipos) - Necesario para ABM
  const hydrateCatalog = useCatalogStore((s) => s.hydrate);
  const isLoadingCatalog = useCatalogStore(selectIsCatalogLoading);
  const isHydratedCatalog = useCatalogStore(selectIsCatalogHydrated);

  useEffect(() => {
    hydrateCatalog();
  }, [hydrateCatalog]);

  // Si está cargando el catálogo inicial, mostramos loading
  if (isLoadingCatalog && !isHydratedCatalog) {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex items-start w-full bg-gray-50">
        {/* Sidebar Específico de Admin */}
        <AdminSidebar />

        <main className="flex-1 min-w-0 h-screen overflow-auto">
          <Outlet />
        </main>

        {/* Modal de seguridad */}
        <InactivityModal />
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
