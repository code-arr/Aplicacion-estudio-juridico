import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
/* import { getClientById } from "@/utils/clientService"; */

const ClientDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  /*   useEffect(() => {
    if (!user || user.role !== "lawyer") return;

    getClientById(id!).then((fetchedClient) => {
      if (fetchedClient?.assignedLawyerEmail === user.email) {
        setClient(fetchedClient);
      }
      setLoading(false);
    });
  }, [id, user]); */

  if (!user) return <Navigate to="/" />;
  if (user.role !== "lawyer") return <Navigate to="/dashboard" />;
  if (!loading && !client) return <Navigate to="/dashboard" />; // acceso denegado

  return loading ? (
    <p>Cargando cliente...</p>
  ) : (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">{client.fullName}</h2>
      <p>Estado del caso: {client.caseStatus}</p>
      <p>Tipo de caso: {client.caseType}</p>
      {/* más info */}
    </div>
  );
};

export default ClientDetailPage;
