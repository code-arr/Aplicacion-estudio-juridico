// src/layouts/LawyerLayout.tsx
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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

// Hooks de Seguridad y Timers
import { useTokenExpirationWatcher } from "@/hooks/useTokenExpirationWatcher";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { useAppPresenceTimer } from "@/hooks/useAppPresenceTimer";
import { useActivityHeartbeat } from "@/hooks/useActivityHeartbeat";
/* import { useEnsureTimerPrimed } from "@/hooks/useEnsureTimerPrimed"; */
import { useTimerEngineGate } from "@/hooks/useTimerEngineGate";
import { useTimeSyncInit } from "@/hooks/useTimeSyncInit";
import { useIdleWatch } from "@/hooks/useIdleWatch";

const LawyerLayout = () => {
  const navigate = useNavigate();
  const logOut = useAuthStore((s) => s.logout);
  const lawyer = useLawyerStore((s) => s.lawyer);
  const lawyerId = lawyer?.id;

  // ⏱️ Timers SIEMPRE activos en este layout
  const timersEnabled = !!lawyerId;

  // === 1. Lógica de Electron / Logs (Mantenida igual) ===
  useEffect(() => {
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
      console.log(
        "%c[TIME-ENTRY]",
        "color:#10b981;font-weight:bold",
        `${entry.pauseReason?.toUpperCase()} | ${entry.trackableType}:${
          entry.trackableId
        } | ${hms(entry.durationSec)} |`,
        `${entry.startedAtUTC} → ${entry.endedAtUTC}`
      );
    };
    window.electronAPI?.on?.("dev:time-entry", handler);
  }, []);

  // === 2. Inicialización de Timers y Seguridad ===
  useTimeSyncInit();
  useTimerEngineGate(timersEnabled, lawyerId);
  useTokenExpirationWatcher();
  useInactivityLogout();
  /* useActivityHeartbeat({ enabled: timersEnabled }); */
  useAppPresenceTimer(timersEnabled);
  /*   useEnsureTimerPrimed(timersEnabled); */
  /* useIdleWatch(timersEnabled); */

  // === 3. Carga de Datos (Catálogo + Clientes del Abogado) ===
  const hydrateCatalog = useCatalogStore((s) => s.hydrate);
  const isLoadingCatalog = useCatalogStore(selectIsCatalogLoading);
  const isHydratedCatalog = useCatalogStore(selectIsCatalogHydrated);

  useEffect(() => {
    hydrateCatalog();
  }, [hydrateCatalog]);

  const hydrateClientsByLawyer = useClientStore((s) => s.hydrateByLawyer);
  const isLoadingClientsByLawyer = useClientStore((s) => s.isLoadingByLawyer);
  const isHydratedClientsByLawyer = useClientStore((s) => s.isHydratedByLawyer);

  useEffect(() => {
    if (lawyerId) {
      hydrateClientsByLawyer(lawyerId);
    }
  }, [hydrateClientsByLawyer, lawyerId]);

  // Prefetch de Items (cuando ya tenemos clientes)
  const hydrateClientItems = useClientItemStore((s) => s.hydrateByLawyer);
  const itemClientsIsPrefetched = useClientItemStore(
    selectIsClientItemsPrefetched
  );

  useEffect(() => {
    if (
      isHydratedCatalog &&
      isHydratedClientsByLawyer &&
      !itemClientsIsPrefetched &&
      lawyerId
    ) {
      hydrateClientItems(lawyerId);
    }
  }, [
    isHydratedCatalog,
    isHydratedClientsByLawyer,
    itemClientsIsPrefetched,
    hydrateClientItems,
    lawyerId,
  ]);

  const handleLogout = async () => {
    await logOut();
    navigate("/", { replace: true }); // Redirige explícitamente al login
  };

  // === 4. Pantalla de Carga ===
  // Esperamos catálogo y clientes básicos para renderizar
  if (
    (!isHydratedCatalog && isLoadingCatalog) ||
    (!isHydratedClientsByLawyer && isLoadingClientsByLawyer)
  ) {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex items-start w-full bg-gray-50">
        <LawyerSidebar lawyer={lawyer} onLogout={handleLogout} />

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>

        <InactivityModal />
        <WorkTimeBadge />
      </div>
    </SidebarProvider>
  );
};

export default LawyerLayout;
