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

  const setClientDetail = useClientStore((s) => s.setClientDetail);
  const clientDetail = useClientStore(selectClientDetail);

  const { monthSeconds } = useClientTime(clientDetail?.id ?? null);
  const monthTimer = formatHHMMFromSeconds(monthSeconds);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!clientId) return;
    setClientDetail(clientId);
    setLoading(false);
    return () => setClientDetail("");
  }, [clientId, setClientDetail]);

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
