// src/layouts/ClientLayout.tsx
import { Outlet, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const invalidateById = useClientStore((s) => s.invalidateById);
  const isLoadingDetail = useClientStore((s) => s.isLoadingDetail);
  const errorDetail = useClientStore((s) => s.errorDetail);

  const { monthSeconds } = useClientTime(clientDetail?.id ?? null);
  const monthTimer = formatHHMMFromSeconds(monthSeconds);

  const [loading, setLoading] = useState(true);

  // 🚀 Al montar/cambiar clientId: asegurar el detalle (TTL + dedupe)
  useEffect(() => {
    setLoading(true);
    if (!clientId) return;
    // No hace falta setear loading local: el store maneja isLoadingDetail
    void hydrateByDetail(clientId);
    setLoading(false);

    // 🧹 Al desmontar o cambiar de clientId, invalidamos el TTL del detail
    // (no deja basura y permite re-hidratar la próxima vez si hiciera falta)
    return () => {
      invalidateById(clientId);
    };
  }, [clientId, hydrateByDetail, invalidateById]);

  if (loading) return <LoadingSpinner />;

  if (!clientDetail)
    return <ErrorScreen message="Ocurrió un error al encontrar el cliente" />;

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
