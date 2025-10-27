// src/layouts/ClientLayout.tsx
import { Outlet, useParams, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { selectClientDetail, useClientStore } from "@/store/useClientStore";
import ClientHeader from "@/components/clients/ClientHeader"; // tu componente con props
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorScreen from "@/components/shared/ErrorScreen";
import { useFocusContext } from "@/hooks/useFocusContext";
import { useClientTime } from "@/hooks/useClientTime";
import { formatHHMMFromSeconds } from "@/lib/time";

const ClientLayout = () => {
  const { clientId } = useParams();
  const location = useLocation();

  useFocusContext(clientId ? { type: "Client", id: clientId } : null);

  // ⚙️ Store: leemos el detalle y sus flags
  const clientDetail = useClientStore(selectClientDetail);
  const hydrateByDetail = useClientStore((s) => s.hydrateByDetail);
  const clearClientDetail = useClientStore((s) => s.clearClientDetail);

  const isLoadingDetail = useClientStore((s) => s.isLoadingDetail);
  const isRefreshingDetail = useClientStore((s) => s.isRefreshingDetail);
  const errorDetail = useClientStore((s) => s.errorDetail);

  const { monthSeconds } = useClientTime(clientDetail?.id ?? null);
  const monthTimer = formatHHMMFromSeconds(monthSeconds);

  // 🚀 Al montar/cambiar clientId: asegurar el detalle (TTL + dedupe)
  useEffect(() => {
    if (!clientId) return;
    void hydrateByDetail(clientId);
    return () => {
      clearClientDetail(clientId);
    };
  }, [clientId, hydrateByDetail, clearClientDetail]);

  if (!clientId) return <ErrorScreen message="Cliente no especificado." />;

  if (isLoadingDetail || isRefreshingDetail) return <LoadingSpinner />;

  if (!clientDetail || clientDetail.id !== clientId) {
    return (
      <ErrorScreen
        message={errorDetail ?? "Ocurrió un error al encontrar el cliente"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader
        client={clientDetail}
        prevRoute={location.state?.prevRoute ? location.state.prevRoute : null}
        timer={monthTimer} // ← ahora muestra el acumulado del mes
      />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;
