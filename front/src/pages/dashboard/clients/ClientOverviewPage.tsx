import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useClientStore } from "@/store/useClientStore";
import { mockClients } from "@/mocks/mockClients";
import { mockCategories } from "@/mocks/mockCategories";
import { formatTimeFromSeconds } from "@/utils/timeUtils";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Avatar, AvatarFallback } from "@components/ui/avatar";

import { ArrowLeft, FileText, Plus, SquarePlus } from "lucide-react";

const ClientOverviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientDetail, setClientDetail } = useClientStore();
  const [loading, setLoading] = useState(true);

  const mockClientDetail = mockClients.find((client) => client.id === id);
  const simulatedTime = 1232;

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddItem = () => {};

  useEffect(() => {
    setLoading(true);
    if (mockClientDetail) {
      setClientDetail(mockClientDetail);
    }
    setLoading(false);
  }, [mockClientDetail, setClientDetail, id]);

  const itemTypes = [
    { value: "contratos", label: "Contratos" },
    { value: "redaccion", label: "Redacción de Documento" },
    { value: "investigacion", label: "Investigación Legal" },
    { value: "otro", label: "Otro (personalizado)" },
  ];

  const contractTypes = [
    "Contrato de Servicios",
    "Contrato de Compraventa",
    "Contrato Laboral",
    "Contrato de Arrendamiento",
    "Acuerdo de Confidencialidad",
    "Contrato de Sociedad",
    "Otro",
  ];

  const documentTypes = [
    "Carta Legal",
    "Demanda",
    "Contestación",
    "Recurso",
    "Poder",
    "Escritura",
    "Dictamen Legal",
    "Otro",
  ];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[hsl(210,100%,45%)] law-gradient text-white p-6 shadow-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className=" text-white hover:bg-white/10 p-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-[hsl(210,40%,98%)] text-[hsl(210,100%,45%)] font-semibold text-lg gap-x-[0.05rem]">
                <span>{clientDetail?.firstName?.charAt(0).toUpperCase()} </span>
                <span>{clientDetail?.lastName?.charAt(0).toUpperCase()} </span>
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{`${clientDetail?.firstName} ${clientDetail?.lastName}`}</h2>
              <p className="text-base text-white/80">{clientDetail?.rut}</p>
            </div>
          </div>
          <div className="ml-auto bg-white text-[hsl(225,15%,15%)] rounded px-3 py-2 flex items-center gap-2 text-xl font-semibold shadow-sm">
            {/* {formatTimeFromSeconds(simulatedTime)} */} 00:00
            <span className="w-3 h-3 ml-0.5 bg-yellow-400 rounded-full shadow-[0_0_6px_3px_rgba(250,204,21,0.6)]" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
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
            <Button className="bg-[#f3b600] hover:bg-[#ffbf00]/80 border-[1.5px] border-gray-500">
              <SquarePlus />
              Agregar Item
            </Button>
          </CardHeader>
          {/* Formulario de ítems */}
          <CardContent className="space-y-4">
            {mockCategories.length === 0 ? (
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
                {mockCategories.map((category) => (
                  <Button
                    key={category.id}
                    className="h-16 bg-[#f3b600] hover:bg-[#f3b600]/70"
                  >
                    {category.type}
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
    </div>
  );
};

export default ClientOverviewPage;
