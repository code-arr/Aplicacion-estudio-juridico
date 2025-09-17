import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { type Client, CLIENT_STATUS_MAP } from "@/types/Client";
import type { ClientItem } from "@/types/ClientItem";
import { selectCategories, useCatalogStore } from "@/store/useCatalogStore";
import { selectClientDetail, useClientStore } from "@/store/useClientStore";
import {
  useClientItemStore,
  selectRecentClientItemsByClientId,
} from "@/store/useClientItemStore";
import ItemForm from "@/components/items/ItemForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorScreen from "@/components/shared/ErrorScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatTimeFromSeconds } from "@/utils/dateTime";
import googleLogo from "@/assets/logos/google.png";
import { FileText, Plus, Search, SquarePlus } from "lucide-react";
import ItemCard from "@/components/items/ItemCard";
import { ItemsSearchBar } from "@/components/items/ItemSearchBar";

const ClientOverviewPage = () => {
  /*   const { id } = useParams(); */
  const navigate = useNavigate();
  const location = useLocation();
  /*   const setClientDetail = useClientStore((s) => s.setClientDetail); */
  const clientDetail = useClientStore(selectClientDetail);
  const categories = useCatalogStore(selectCategories);
  const fetchClientItemsByClientId = useClientItemStore(
    (s) => s.fetchClientItemsByClientId
  );
  const clientItemsByClientId = useClientItemStore(
    (s) => s.clientItemsByClientId //Despues cambiar por s.clientItemsByClientId
  );
  const recentClientItemsByClientId = useClientItemStore(
    selectRecentClientItemsByClientId
  );

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenCategory = (categoryId: string) => {
    navigate(`category/${categoryId}`, {
      state: { prevRoute: location.pathname },
    });
  };

  console.log(location.pathname);

  const handleViewDetails = (item: ClientItem) => {
    navigate(`/dashboard/item/${item.id}`, {
      state: { prevRoute: location.pathname },
    });
  };

  useEffect(() => {
    setLoading(true);
    if (clientDetail) setLoading(false);
  }, [clientDetail]);

  useEffect(() => {
    if (!clientDetail) return;

    const fetchData = async () => {
      await fetchClientItemsByClientId(clientDetail.id);
    };

    fetchData();
  }, [clientDetail, fetchClientItemsByClientId]);

  const StatusBadge = (status: Client["status"]) => {
    const cfg = CLIENT_STATUS_MAP[status] ?? {
      label: "Desconocido",
      className: "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200",
    };
    return (
      <Badge
        className={`${cfg.className}rounded-xl text-sm font-semibold cursor-default`}
      >
        {cfg.label}
      </Badge>
    );
  };

  const statusMap = {
    active: <span className="text-green-600 font-medium">Activo</span>,
    inactive: (
      <span className="text-muted-foreground font-medium">Inactivo</span>
    ),
    under_review: (
      <span className="text-yellow-600 font-medium">En revisión</span>
    ),
  };

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString);

    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    const formatted = date
      .toLocaleDateString("es-ES", options)
      .replace(",", "");
    return capitalize(formatted);
  }

  if (loading) return <LoadingSpinner />;

  if (!clientDetail)
    return <ErrorScreen message="Ocurrió un error al mostrar el cliente" />;

  return loading ? (
    <p className="p-6 text-gray-700">Cargando cliente...</p>
  ) : (
    <div>
      <ItemForm isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      <div className="space-y-6">
        {/* CONTENEDOR GENERAL */}
        <div className="bg-white border border-gray-200 rounded-md shadow px-6 max-w-8xl mx-auto">
          {/* SECCIÓN DE INFORMACIÓN Y ACCIONES CON LÍNEA VERTICAL */}

          <div className="flex flex-col md:flex-row md:items-stretch gap-6  ">
            {/* INFORMACIÓN DEL CLIENTE */}
            <div className="md:w-1/2 md:pr-6 md:border-r md:border-gray-200">
              <div className="pt-4 pr-6">
                <h3 className="font-semibold text-[hsl(225,15%,15%)] mb-3">
                  Información del Cliente
                </h3>
              </div>
              <div className="flex pb-4 pr-6">
                <div className="w-1/2">
                  <p className="text-sm text-[hsl(225,10%,50%)]">
                    Tipo de Cliente
                  </p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {clientDetail.type === "Fisica"
                      ? "Persona Física"
                      : "Persona Jurídica"}
                  </p>

                  <p className="text-sm text-[hsl(225,10%,50%)]">
                    Última Actualización
                  </p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {formatDate(
                      clientDetail.updateAt
                        ? clientDetail.updateAt
                        : clientDetail.createAt
                    )}
                  </p>

                  <p className="text-sm text-[hsl(225,10%,50%)]">Estado</p>
                  <div className="mt-1">{StatusBadge(clientDetail.status)}</div>
                </div>
                <div className="w-1/2">
                  <p className="text-sm text-[hsl(225,10%,50%)]">
                    Correo Electrónico
                  </p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {clientDetail.email}
                  </p>
                  <p className="text-sm text-[hsl(225,10%,50%)]">Telefono</p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {clientDetail.phone}
                  </p>
                  <p className="text-sm text-[hsl(225,10%,50%)]">Dirección</p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {clientDetail.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Google */}
            <div className="flex justify-between md:w-1/2">
              <div>
                <div className="py-4">
                  <h3 className="font-semibold text-[hsl(225,15%,15%)] mb-3">
                    Gmail
                  </h3>
                  <Button
                    variant="outline"
                    className="font-semibold border-[hsl(210,100%,40%)] hover:bg-[hsl(210,100%,95%)] cursor-pointer"
                  >
                    <img
                      src={googleLogo}
                      className="w-5 h-5"
                      alt="Logo Google"
                    />
                    Enviar mail
                  </Button>
                </div>
                <div className="py-3">
                  <h3 className="font-semibold text-[hsl(225,15%,15%)] mb-3">
                    Proxima Reunión
                  </h3>
                  <Button
                    variant="outline"
                    className="flex flex-col h-fit px-4 gap-y-0.5 font-semibold border-[hsl(210,100%,40%)] hover:bg-[hsl(210,100%,95%)] cursor-pointer"
                  >
                    <div className="flex items-center gap-x-2">
                      <img
                        src={googleLogo}
                        className="w-4 h-4"
                        alt="Logo Google"
                      />
                      <p>Meet</p>
                    </div>
                    <div>
                      <p className="font-medium">jueves, 28 ago. 10:30</p>
                    </div>
                  </Button>
                </div>
              </div>
              <div className="self-center flex flex-col items-end gap-y-10">
                <Button
                  variant="outline"
                  className="w-full py-5 font-semibold border-[hsl(210,100%,40%)] hover:bg-[hsl(210,100%,95%)] cursor-pointer"
                >
                  Editar cliente
                </Button>

                <Button
                  variant="outline"
                  className="w-full py-5 font-semibold border-red-500  bg-red-500 hover:bg-red-300 text-white cursor-pointer"
                >
                  Eliminar cliente
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <Card className="bg-white border-gray-200 shadow-sm rounded-lg">
          <CardHeader className="flex-row justify-between border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-[hsl(225,15%,15%)]">
              <FileText className="h-5 w-5" />
              Contenido del Cliente
            </CardTitle>
            <div className="flex w-1/2 gap-5">
              <div className="relative flex-1">
                <ItemsSearchBar
                  items={clientItemsByClientId} // tu lista completa del cliente
                  limit={4}
                  onSelect={(item) => {
                    // navegar al detalle o completar el input
                    navigate(`/dashboard/item/${item.id}`, {
                      state: { prevRoute: location.pathname },
                    });
                  }}
                />
                {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                /> */}
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#f3b600] hover:bg-[#ffbf00]/80 shadow-lg  cursor-pointer"
              >
                <SquarePlus />
                Agregar Item
              </Button>
            </div>
          </CardHeader>

          {/* Formulario de ítems */}
          <CardContent className="space-y-3 divide-y divide-gray-200">
            {categories.length === 0 ? (
              <div className="text-center py-6  ">
                <h3 className="text-lg font-medium text-[hsl(225,15%,15%)] mb-2">
                  No hay categorias aún
                </h3>
                <p className="text-gray-600">Agrega tu primer categoria</p>
                <Button className="law-gradient hover:opacity-90 mt-5">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Categoria
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-5 py-6 gap-x-3">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    className="h-16 bg-[#f3b600] hover:bg-[#f3b600]/70 text-base capitalize"
                    onClick={() => handleOpenCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
            <div className="pt-2">
              <h3 className="font-semibold text-[1.1rem] text-[hsl(225,15%,15%)] mb-3">
                Items Recientes
              </h3>
              <div className="grid grid-cols-1 pr-10 gap-4">
                {recentClientItemsByClientId?.map((item) => {
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onViewDetails={handleViewDetails}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="bg-[#ffffff] border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-[hsl(225,15%,15%)]">
              Resumen del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[hsl(225,10%,50%)]">Tiempo Total</p>
                <p className="font-semibold text-[hsl(225,15%,15%)]">00:00</p>
              </div>
              <div>
                <p className="text-[hsl(225,10%,50%)]">Ítems Registrados</p>
                <p className="font-semibold text-[hsl(225,15%,15%)]">0</p>
              </div>
              <div>
                <p className="text-[hsl(225,10%,50%)]">Último Movimiento</p>
                <p className="font-semibold text-[hsl(225,15%,15%)]">
                  Sin actividad
                </p>
              </div>
              <div>
                <p className="text-[hsl(225,10%,50%)]">Estado</p>
                <p className="font-semibold">
                  {clientDetail?.status && statusMap[clientDetail.status]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientOverviewPage;
