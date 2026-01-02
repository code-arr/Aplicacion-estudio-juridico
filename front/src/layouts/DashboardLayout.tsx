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
import { useClientStore } from "@/store/useClientStore";
import {
  useClientItemStore,
  selectIsClientItemsPrefetched,
} from "@/store/useClientItemStore";
import { SidebarProvider } from "@/components/ui/sidebar";
import LawyerSidebar from "@/components/lawyer/LawyerSidebar";
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
import AdminSidebar from "@/components/admin/AdminSidebar";

const DashboardLayout = () => {
  const user = useAuthStore((s) => s.user);
  const logOut = useAuthStore((s) => s.logout);
  const isAdmin = user?.role === "admin";

  const lawyer = useLawyerStore((s) => s.lawyer);
  const lawyerId = lawyer?.id;

  // ⏱️ Timers sólo para Lawyer (no Admin)
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
        `ClientID: ${entry.clientId} `,
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
  /* useActivityHeartbeat({ enabled: timersEnabled }); */
  useAppPresenceTimer(timersEnabled);
  useEnsureTimerPrimed(timersEnabled);
  /* useIdleWatch(timersEnabled); */

  // ──────────────────────────────────────────────────────────────
  // Data stores
  // ──────────────────────────────────────────────────────────────

  // Catalogo: lo necesitan ambas vistas (Lawyer/Admin)
  const hydrateCatalog = useCatalogStore((s) => s.hydrate);
  const isLoadingCatalog = useCatalogStore(selectIsCatalogLoading);
  const isHydratedCatalog = useCatalogStore(selectIsCatalogHydrated);

  // 🔸 Catálogo lo puede necesitar cualquiera
  useEffect(() => {
    hydrateCatalog(); // respeta TTL
  }, [hydrateCatalog]);

  // ===== Clients (solo lawyer) —> adaptado a la nueva store =====
  const hydrateClientsByLawyer = useClientStore((s) => s.hydrateByLawyer);
  const isLoadingClientsByLawyer = useClientStore((s) => s.isLoadingByLawyer); // 👈 nuevo
  const isHydratedClientsByLawyer = useClientStore((s) => s.isHydratedByLawyer); // 👈 nuevo

  useEffect(() => {
    if (!isAdmin && lawyer) {
      hydrateClientsByLawyer(lawyer.id); // respeta TTL
    }
  }, [hydrateClientsByLawyer, isAdmin, lawyer]);

  // ===== ClientItems (prefetch) solo en lawyer, cuando ya hay cat + clients =====
  const hydrateClientItems = useClientItemStore((s) => s.hydrateByLawyer);
  const itemClientsIsPrefetched = useClientItemStore(
    selectIsClientItemsPrefetched
  );

  useEffect(() => {
    if (
      !isAdmin &&
      isHydratedCatalog &&
      isHydratedClientsByLawyer &&
      !itemClientsIsPrefetched
    ) {
      if (lawyer) {
        hydrateClientItems(lawyer.id);
      }
    }
  }, [
    isAdmin,
    isHydratedCatalog,
    isHydratedClientsByLawyer,
    hydrateClientItems,
    itemClientsIsPrefetched,
    lawyer,
  ]);

  //===== ADMIN =====

  // ===== Clients (admin) —> adaptado a la nueva store =====
  const hydrateAllClients = useClientStore((s) => s.hydrateAll);
  const isLoadingAllClients = useClientStore((s) => s.isLoadingAll); // 👈 nuevo
  const isHydratedAllClients = useClientStore((s) => s.isHydratedAll); // 👈 nuevo

  useEffect(() => {
    if (isAdmin) {
      hydrateAllClients(); // respeta TTL
    }
  }, [hydrateAllClients, isAdmin]);

  // ===== ClientItems (admin), cuando ya hay cat + clients =====
  const hydrateAllClientItems = useClientItemStore((s) => s.hydrate);
  const isHydratedAllClientItems = useClientItemStore((s) => s.isHydrated);

  useEffect(() => {
    if (
      isAdmin &&
      isHydratedCatalog &&
      isHydratedAllClients &&
      !isHydratedAllClientItems
    )
      hydrateAllClientItems();
  }, [
    isAdmin,
    isHydratedCatalog,
    isHydratedAllClients,
    hydrateAllClientItems,
    isHydratedAllClientItems,
  ]);

  // ===== Pantallas de carga =====
  // Lawyer: esperamos catálogo + clientes
  if (
    !isAdmin &&
    ((!isHydratedCatalog && isLoadingCatalog) ||
      (!isHydratedClientsByLawyer && isLoadingClientsByLawyer))
  ) {
    return <LoadingScreen />;
  }

  // Admin: con catálogo basta para montar; las páginas admin traen su data
  if (isAdmin && isLoadingCatalog && !isHydratedCatalog) {
    return <LoadingScreen />;
  }

  // ===== Layout =====
  return (
    <SidebarProvider>
      <div className="min-h-screen flex items-start w-full bg-gray-50">
        {isAdmin ? (
          <AdminSidebar />
        ) : (
          <LawyerSidebar lawyer={lawyer} onLogout={logOut} />
        )}

        <main className="flex-1 min-w-0">
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
