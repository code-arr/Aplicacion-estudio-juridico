// src/layouts/ItemLayout.tsx
import { useEffect, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";

import {
  selectClientItemDetail,
  useClientItemStore,
} from "@/store/useClientItemStore";
import { useClientStore } from "@/store/useClientStore";

import ItemHeader from "@/components/items/ItemHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorScreen from "@/components/shared/ErrorScreen";
import { useFocusContext } from "@/hooks/useFocusContext";

const ItemLayout = () => {
  const { clientItemId } = useParams();
  const location = useLocation();

  // ====== STORE: ITEMS ======
  const setItemDetail = useClientItemStore((s) => s.setClientItemDetail);
  const itemDetail = useClientItemStore(selectClientItemDetail);
  const isHydratedItems = useClientItemStore((s) => s.isHydrated);

  // ====== STORE: CLIENT ======
  const hydrateClientDetail = useClientStore((s) => s.hydrateByDetail);
  const clientDetail = useClientStore((s) => s.clientDetail);
  // Si tenés flags de detalle de cliente, podrías leerlos así:
  // const isLoadingClientDetail = useClientStore((s) => s.isLoadingDetail);
  // const errorClientDetail = useClientStore((s) => s.errorDetail);

  const [loading, setLoading] = useState(true);

  useFocusContext(
    clientDetail
      ? { type: "Client", id: clientDetail.id ?? "", clientId: clientDetail.id }
      : null
  );

  // 1) Cuando la lista de items ya está hidratada y cambia el itemId => seteo el item detail
  useEffect(() => {
    setLoading(true);
    if (!isHydratedItems) return;
    if (!clientItemId) return;
    setItemDetail(clientItemId);
    setLoading(false);
  }, [clientItemId, setItemDetail, isHydratedItems]);

  // 2) Cuando ya conozco el clientId del item => hidrato el detalle del cliente
  useEffect(() => {
    if (!isHydratedItems) return;
    if (!itemDetail?.clientId) return;
    // Esto usa cache si ya tenés el cliente; si no, cuando agregues getClientById,
    // va a traerlo del back automáticamente sin tocar este componente.
    void hydrateClientDetail(itemDetail.clientId);
  }, [isHydratedItems, itemDetail?.clientId, hydrateClientDetail]);

  if (loading || !isHydratedItems) return <LoadingSpinner />;

  if (!itemDetail)
    return <ErrorScreen message="Ocurrió un error al encontrar el item" />;

  return (
    <div className="min-h-screen bg-gray-100 bg-gradient-to-t from-[#334155] via-[#3b4d66] to-[#60a5fa]/20">
      <main className="p-10">
        <ItemHeader
          item={itemDetail}
          prevRoute={
            location.state?.prevRoute ? location.state.prevRoute : null
          }
          timer="00:00" // más adelante podrías sacarlo de un hook
        />
        <div className="bg-white px-6 pb-4 rounded-b-lg">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ItemLayout;
