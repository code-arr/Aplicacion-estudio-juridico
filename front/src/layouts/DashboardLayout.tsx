import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
import { useTimerStore } from "@/store/timer/useTimerStore";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/lawyer/AppSidebar";
import WorkTimeBadge from "@/components/timer/WorkTimeBadge";
import InactivityModal from "@/components/shared/InactivityModal";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { useTokenExpirationWatcher } from "@/hooks/useTokenExpirationWatcher";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useAppPresenceTimer } from "@/hooks/useAppPresenceTimer";
import { useActivityHeartbeat } from "@/hooks/useActivityHeartbeat";
import { useIdleWatch } from "@/hooks/useIdleWatch";
import { useMidnightReset } from "@/hooks/useMidnightReset";
import { useTimeSyncInit } from "@/hooks/useTimeSyncInit";

const DashboardLayout = () => {
  // estado de usuario/rol/abogado
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const lawyer = useLawyerStore((s) => s.lawyer);

  // habilitamos timers SOLO cuando hay lawyer y no es admin
  const timersEnabled = !!lawyer && !isAdmin;

  // ⏰ Hooks se activan apenas entra al dashboard
  useTokenExpirationWatcher(); // Hook que detecta si el token definitivo del back ya expiro o es invalido y cierra sesion
  useInactivityLogout(); // Hook que detecta la inactividad del usuario para cerrar sesion

  // Hooks globales (siempre llamados, pero con enabled)
  useActivityHeartbeat({ enabled: timersEnabled });
  useIdleWatch(timersEnabled);
  useMidnightReset({ enabled: timersEnabled });
  useAppPresenceTimer(timersEnabled);
  useTimeSyncInit(timersEnabled);

  // 🔁 Cada cambio de ruta: si quedó sin contexto, encendé LawyerApp sin esperar interacción
  /*   useEffect(() => {
    if (!timersEnabled) return;
    
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      const s = useTimerStore.getState();
      if (!s.active && document.visibilityState === "visible") {
        s.start({ type: "LawyerApp", id: lawyer!.id }, "auto"); // 👈 source "auto"
        }
        });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      };
  }, [location.key, timersEnabled, lawyer?.id]); */

  useEffect(() => {
    if (!timersEnabled) return;
    if (document.visibilityState !== "visible") return;

    const s = useTimerStore.getState();
    if (!s.active) {
      if (s.status !== "running") {
        s.workStart();
        console.log("Se prende el global desde DashboardLayout");
      } // 🔥 prende global
      s.start({ type: "LawyerApp", id: lawyer!.id }, "auto");
    }
  }, [timersEnabled, lawyer?.id]);

  const logOut = useAuthStore((s) => s.logout);

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
    (!isHydratedClients && isLoadingClients) ||
    (!isAdmin && !lawyer?.id)
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
        {timersEnabled && <WorkTimeBadge />}
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
