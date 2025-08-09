import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@components/lawyer/AppSidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { useCatalogStore } from "@/store/useCatalogStore";
import { getCatalogData } from "@/api/catalog";
import { Outlet } from "react-router-dom";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import InactivityModal from "@components/shared/InactivityModal";
import { useTokenExpirationWatcher } from "@/hooks/useTokenExpirationWatcher";
import { mockLawyer } from "@/mocks/mockLawyer";
import { useEffect } from "react";

const DashboardLayout = () => {
  // ⏰ Hooks se activan apenas entra al dashboard
  /* useTokenExpirationWatcher(); */ // Hook que detecta si el token definitivo del back ya expiro o es invalido y cierra sesion
  useInactivityLogout(); // Hook que detecta la inactividad del usuario para cerrar sesion

  const { user } = useAuthStore();

  useEffect(() => {
    if (useCatalogStore.getState().categories.length > 0) return;

    const loadCatalog = async () => {
      try {
        const data = await getCatalogData();
        useCatalogStore.getState().setCatalogData(data);
      } catch (error) {
        console.error("Error cargando catálogo:", error);
      }
    };

    loadCatalog();
  }, []);

  const onLogout = () => {
    // logout real
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex items-start w-full bg-gray-50">
        <AppSidebar lawyer={mockLawyer} onLogout={onLogout} />
        {/* Aca en seria mejor pasarle role={user.role} en lugar de lawyer={user} */}
        <main className="flex-1 p-4">
          <Outlet />
        </main>
        {/* 🔔 Modal de advertencia de inactividad */}
        <InactivityModal />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
