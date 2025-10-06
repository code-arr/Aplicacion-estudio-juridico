// src/layouts/DashboardLayout.tsx
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
import AppSidebar from "@/components/lawyer/AppSidebar";
import WorkTimeBadge from "@/components/timer/WorkTimeBadge";
import InactivityModal from "@/components/shared/InactivityModal";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { useTokenExpirationWatcher } from "@/hooks/useTokenExpirationWatcher";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useAppPresenceTimer } from "@/hooks/useAppPresenceTimer";
import { useActivityHeartbeat } from "@/hooks/useActivityHeartbeat";
import { useEnsureTimerPrimed } from "@/hooks/useEnsureTimerPrimed";
import { useTimerEngineGate } from "@/hooks/useTimerEngineGate";
import { useTimeSyncInit } from "@/hooks/useTimeSyncInit";
import { useIdleWatch } from "@/hooks/useIdleWatch";

const DashboardLayout = () => {
  const user = useAuthStore((s) => s.user);
  const logOut = useAuthStore((s) => s.logout);
  const isAdmin = user?.role === "admin";
  const lawyer = useLawyerStore((s) => s.lawyer);
  const lawyerId = lawyer?.id;
  const timersEnabled = !!lawyerId && !isAdmin;

  // Suscripción a logs de time-entries (solo en Electron)
  useEffect(() => {
    // Suscribite SOLO una vez
    const handler = (_evt: any, entry: any) => {
      const hms = (s: number) => {
        const hh = Math.floor(s / 3600);
        const mm = Math.floor((s % 3600) / 60);
        const ss = s % 60;
        return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
          2,
          "0"
        )}:${String(ss).padStart(2, "0")}`;
      };
      // Log “lindo”
      console.log(
        "%c[TIME-ENTRY]",
        "color:#10b981;font-weight:bold",
        `${entry.pauseReason?.toUpperCase()} | ${entry.trackableType}:${
          entry.trackableId
        } | ${hms(entry.durationSec)} |`,
        `${entry.startedAtUTC} → ${entry.endedAtUTC}`,
        entry // objeto completo por si querés inspeccionar
      );
    };

    // Si no estás en Electron, no hace nada
    window.electronAPI?.on?.("dev:time-entry", handler);
  }, []);

  useTimeSyncInit();
  // Encender el engine en main (idempotente entre ventanas)
  useTimerEngineGate(timersEnabled, lawyerId, /* appVersion? */ undefined);

  // Seguridad de sesión
  useTokenExpirationWatcher(); // Hook que detecta si el token definitivo del back ya expiro o es invalido y cierra sesion
  useInactivityLogout(); // Hook que detecta la inactividad del usuario para cerrar sesion

  // Timers (renderer)
  useActivityHeartbeat({ enabled: timersEnabled });
  useAppPresenceTimer(timersEnabled);
  useEnsureTimerPrimed(timersEnabled);
  useIdleWatch(timersEnabled);

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

  if (
    (!isHydratedCatalog && isLoadingCatalog) ||
    (!isHydratedClients && isLoadingClients) ||
    (!isAdmin && !lawyer?.id)
  )
    return <LoadingScreen />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex items-start w-full bg-gray-50">
        <AppSidebar lawyer={lawyer} onLogout={logOut} />
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
