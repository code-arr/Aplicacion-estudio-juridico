import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useClientStore } from "@/store/useClientStore";
import { mockClients } from "@/mocks/mockClients";
import ClientHeader from "@/components/clients/ClientHeader"; // tu componente con props

const ClientLayout = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const { clientDetail, setClientDetail } = useClientStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    setLoading(true);
    // Acá iría tu fetch real o mock
    const client = mockClients.find((c) => c.id === clientId);
    if (client) {
      setClientDetail(client);
    }
    setLoading(false);
  }, [clientId, setClientDetail]);

  if (loading || !clientDetail) {
    return <div className="p-6 text-gray-700">Cargando cliente...</div>; // o un spinner
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader
        client={clientDetail}
        onBack={() => navigate(-1)}
        timer="00:00" // más adelante podrías sacarlo de un hook
      />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;
