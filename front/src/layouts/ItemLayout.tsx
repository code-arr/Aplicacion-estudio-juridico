import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import ItemHeader from "@components/items/ItemHeader";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import ErrorScreen from "@components/shared/ErrorScreen";
import {
  selectClientItemDetail,
  useClientItemStore,
} from "@/store/useClientItemStore";
import { useClientStore } from "@/store/useClientStore";

const ItemLayout = () => {
  const { clientItemId } = useParams();
  const navigate = useNavigate();

  const setItemDetail = useClientItemStore((s) => s.setClientItemDetail);
  const setClientDetail = useClientStore((s) => s.setClientDetail);
  const itemDetail = useClientItemStore(selectClientItemDetail);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!clientItemId) return;
    setItemDetail(clientItemId);
    setLoading(false);
  }, [clientItemId, itemDetail, setItemDetail]);

  useEffect(() => {
    if (itemDetail?.clientId) setClientDetail(itemDetail?.clientId);
  }, [setClientDetail, itemDetail?.clientId]);

  if (loading) return <LoadingSpinner />;

  if (!itemDetail)
    return <ErrorScreen message="Ocurrió un error al encontrar el item" />;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-10">
        <ItemHeader
          item={itemDetail}
          onBack={() => navigate(-1)}
          timer="00:00" // más adelante podrías sacarlo de un hook
        />
        <div className="bg-white px-6 pb-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ItemLayout;
