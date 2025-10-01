import { Outlet, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { selectClientDetail, useClientStore } from "@/store/useClientStore";
import ClientHeader from "@/components/clients/ClientHeader"; // tu componente con props
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorScreen from "@/components/shared/ErrorScreen";
import { useFocusContext } from "@/hooks/useFocusContext";

const ClientLayout = () => {
  const { clientId } = useParams();
  useFocusContext(clientId ? { type: "Client", id: clientId } : null);

  const location = useLocation();

  const setClientDetail = useClientStore((s) => s.setClientDetail);
  const clientDetail = useClientStore(selectClientDetail);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!clientId) return;
    setClientDetail(clientId);
    setLoading(false);
  }, [clientId, setClientDetail]);

  if (loading) return <LoadingSpinner />;

  if (!clientDetail)
    return <ErrorScreen message="Ocurrió un error al encontrar el cliente" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader
        client={clientDetail}
        prevRoute={location.state?.prevRoute ? location.state.prevRoute : null}
        timer="00:00" // más adelante podrías sacarlo de un hook
      />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;
