import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@components/lawyer/AppSidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { Outlet } from "react-router-dom";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import InactivityModal from "@components/shared/InactivityModal";
import { useTokenExpirationWatcher } from "@/hooks/useTokenExpirationWatcher";
import { mockLawyer } from "@/mocks/mockLawyer";

const DashboardLayout = () => {
  // ⏰ Hooks se activan apenas entra al dashboard
  /* useTokenExpirationWatcher(); */ // Hook que detecta si el token definitivo del back ya expiro o es invalido y cierra sesion
  useInactivityLogout(); // Hook que detecta la inactividad del usuario para cerrar sesion

  const { user } = useAuthStore();

  const onLogout = () => {
    // logout real
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
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
