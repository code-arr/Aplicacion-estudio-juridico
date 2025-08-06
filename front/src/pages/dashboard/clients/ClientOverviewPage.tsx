import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useClientStore } from "@/store/useClientStore";
import { mockClients } from "@/mocks/mockClients";
/* import { mockCategories } from "@/mocks/mockCategories"; */
import { formatTimeFromSeconds } from "@/utils/timeUtils";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";

import { FileText, Plus, Search, SquarePlus } from "lucide-react";
import { useCatalogStore } from "@/store/useCatalogStore";
import { Input } from "@components/ui/input";

const ClientOverviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientDetail, setClientDetail } = useClientStore();
  const { categories } = useCatalogStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const mockClientDetail = mockClients.find((client) => client.id === id);
  const simulatedTime = 1232;

  const handleAddItem = () => {};

  const handleOpenCategory = (categoryId: string) => {
    navigate(`category/${categoryId}`);
  };

  useEffect(() => {
    setLoading(true);
    if (mockClientDetail) {
      setClientDetail(mockClientDetail);
    }
    setLoading(false);
  }, [mockClientDetail, setClientDetail, id]);

  const statusMap = {
    activo: <span className="text-green-600 font-medium">Activo</span>,
    inactivo: (
      <span className="text-muted-foreground font-medium">Inactivo</span>
    ),
    en_revision: (
      <span className="text-yellow-600 font-medium">En revisión</span>
    ),
  };

  return loading ? (
    <p className="p-6 text-gray-700">Cargando cliente...</p>
  ) : (
    <div className="space-y-6">
      {/* CONTENEDOR GENERAL */}
      <div className="bg-white border border-gray-200 rounded-md shadow px-6 max-w-8xl mx-auto">
        {/* SECCIÓN DE INFORMACIÓN Y NOTAS CON LÍNEA VERTICAL */}
        <div className="flex flex-col md:flex-row md:items-stretch gap-6  ">
          {/* INFORMACIÓN DEL CLIENTE */}
          <div className="md:w-1/2 md:pr-6 md:border-r md:border-gray-200">
            <div className="py-4 pr-6">
              <h3 className="font-semibold text-[hsl(225,15%,15%)] mb-3">
                Información del Cliente
              </h3>
              <p className="text-sm text-[hsl(225,10%,50%)]">Tipo de Caso</p>
              <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                Tributario
              </p>

              <p className="text-sm text-[hsl(225,10%,50%)]">
                Última Actualización
              </p>
              <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                12 Dic 2024
              </p>

              <p className="text-sm text-[hsl(225,10%,50%)]">Estado</p>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="bg-[hsl(45,100%,85%)] text-[hsl(45,100%,30%)] border-[hsl(45,100%,70%)] text-sm font-medium"
                >
                  En Revisión
                </Badge>
              </div>
            </div>
          </div>

          {/* NOTAS */}
          <div className="md:w-1/2">
            <div className="py-4">
              <h3 className="font-semibold text-[hsl(225,15%,15%)] mb-3">
                Notas
              </h3>
              <p className="text-[hsl(225,10%,50%)] mb-4">
                No hay notas registradas aún.
              </p>
              <Button
                variant="outline"
                className="text-[hsl(210,100%,40%)] border-[hsl(210,100%,40%)] hover:bg-[hsl(210,100%,95%)]"
              >
                + Agregar Nota
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
          <div className="flex w-2/5 gap-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-[#f3b600] hover:bg-[#ffbf00]/80 border-[1.5px] border-gray-500 cursor-pointer">
              <SquarePlus />
              Agregar Item
            </Button>
          </div>
        </CardHeader>
        {/* Formulario de ítems */}
        <CardContent className="space-y-4">
          {categories.length === 0 ? (
            <div className="text-center py-6  ">
              <h3 className="text-lg font-medium text-[hsl(225,15%,15%)] mb-2">
                No hay categorias aún
              </h3>
              <p className="text-gray-600">Agrega tu primer categoria</p>
              <Button
                className="law-gradient hover:opacity-90 mt-5"
                onClick={() => console.log("")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Categoria
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 py-6 gap-x-6">
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
                {clientDetail?.clientStatus &&
                  statusMap[clientDetail.clientStatus]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientOverviewPage;
