import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useLawyerStore } from "@/store/useLawyerStore";
import {
  useCatalogStore,
  selectIsCatalogLoading,
  selectIsCatalogHydrated,
} from "@/store/useCatalogStore";
import {
  selectIsClientsHydrated,
  selectIsLoadingClients,
  useClientStore,
} from "@/store/useClientStore";
import {
  useClientItemStore,
  selectIsClientItemsPrefetched,
} from "@/store/useClientItemStore";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@components/lawyer/AppSidebar";
import InactivityModal from "@components/shared/InactivityModal";
import LoadingScreen from "@components/shared/LoadingScreen";
import { useTokenExpirationWatcher } from "@/hooks/useTokenExpirationWatcher";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { mockLawyer } from "@/mocks/mockLawyer";

const DashboardLayout = () => {
  // ⏰ Hooks se activan apenas entra al dashboard
  useTokenExpirationWatcher(); // Hook que detecta si el token definitivo del back ya expiro o es invalido y cierra sesion
  useInactivityLogout(); // Hook que detecta la inactividad del usuario para cerrar sesion

  const logOut = useAuthStore((s) => s.logout);

  const lawyer = useLawyerStore((s) => s.lawyer);

  /*   const isRefreshingClients = useClientStore((s) => s.isRefreshing); */
  const hydrateClientsByLawyer = useClientStore((s) => s.hydrateByLawyer);
  const isLoadingClients = useClientStore(selectIsLoadingClients);
  const isHydratedClients = useClientStore(selectIsClientsHydrated);

  /*   const isRefreshingCatalog = useCatalogStore((s) => s.isRefreshing); */
  const hydrateCatalog = useCatalogStore((s) => s.hydrate);
  const isLoadingCatalog = useCatalogStore(selectIsCatalogLoading);
  const isHydratedCatalog = useCatalogStore(selectIsCatalogHydrated);

  const hydrateClientItems = useClientItemStore((s) => s.hydrateByLawyer);
  const itemClientsIsPrefetched = useClientItemStore(
    selectIsClientItemsPrefetched
  );

  // Primer montaje: respeta TTL (no bloquear si hay cache, sí bloquear si es primer fetch)
  useEffect(() => {
    hydrateCatalog(); // respeta TTL
    if (lawyer) hydrateClientsByLawyer(lawyer.id); // respeta TTL
  }, [hydrateCatalog, hydrateClientsByLawyer, lawyer]);

  //Prefecth de clientItems, despues de renderizar la vista "Mis Clientes"
  useEffect(() => {
    if (isHydratedCatalog && isHydratedClients && !itemClientsIsPrefetched)
      if (lawyer) hydrateClientItems(lawyer.id);
  }, [
    isHydratedCatalog,
    isHydratedClients,
    hydrateClientItems,
    itemClientsIsPrefetched,
    lawyer,
  ]);

  const onLogout = () => {
    logOut();
  };

  if (
    (!isHydratedCatalog && isLoadingCatalog) ||
    (!isHydratedClients && isLoadingClients)
  )
    return <LoadingScreen />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex items-start w-full bg-gray-50">
        <AppSidebar lawyer={lawyer} onLogout={onLogout} />
        {/* Aca en seria mejor pasarle role={user.role} en lugar de lawyer={user} */}
        <main className="flex-1">
          <Outlet />
        </main>
        {/* 🔔 Modal de advertencia de inactividad */}
        <InactivityModal />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
