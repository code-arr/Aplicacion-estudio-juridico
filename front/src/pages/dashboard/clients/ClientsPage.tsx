import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Client } from "@/types/Client";

import { useClientStore, selectClientsByLawyer } from "@/store/useClientStore";
import { useClientItemStore } from "@/store/useClientItemStore";

import ClientCard from "@/components/clients/ClientCard";
import ClientForm from "@/components/clients/ClientForm";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyArray from "@/components/shared/EmptyArray";
import ErrorScreen from "@/components/shared/ErrorScreen";

import { Search, Plus } from "lucide-react";

import { mockClients } from "@/mocks/mockClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFocusContext } from "@/hooks/useFocusContext";

const ClientsPage = () => {
  useFocusContext({ type: "LawyerApp", id: "main" });

  const navigate = useNavigate();

  const PAGE_STEP = 12;
  const [pageSize, setPageSize] = useState(PAGE_STEP);
  const [showAll, setShowAll] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [clientOrder, setClientOrder] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ====== CLIENTS (store nueva) ======
  const clients = useClientStore(selectClientsByLawyer);
  const isClientsHydratedByLawyer = useClientStore((s) => s.isHydratedByLawyer); // ✅ nuevo
  const isClientsLoadingByLawyer = useClientStore((s) => s.isLoadingByLawyer); // ✅ nuevo
  const clientsError = useClientStore((s) => s.errorByLawyer); // ✅ nuevo

  // Nota: la hidratación inicial de clientes ocurre en DashboardLayout.
  // Si quisieras auto-hidratar acá por las dudas:
  // const hydrateByLawyer = useClientStore((s) => s.hydrateByLawyer);
  // useEffect(() => { if (!isHydratedByLawyer && !isLoadingByLawyer) hydrateByLawyer(""); }, [isHydratedByLawyer, isLoadingByLawyer, hydrateByLawyer]);

  const resetClientItemsByClientId = useClientItemStore(
    (s) => s.resetClientItemsByClientId
  );

  // Función utilitaria
  const normalizeText = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

  const handleViewDetails = (client: Client) => {
    navigate(`${client.id}`);
  };

  const getStatusCount = (status: Client["status"]) => {
    return clients.filter((client) => client.status === status).length;
  };

  const debouncedQuery = useDebouncedValue(searchTerm, 250);
  const filteredClients = useMemo(() => {
    const term = normalizeText(debouncedQuery.trim());

    return clients.filter((client) => {
      const clientName = normalizeText(
        `${client.firstName ?? ""} ${client.lastName ?? ""} ${
          client.companyName ?? ""
        }`
      );

      const matchesSearch = !term || clientName.includes(term);
      const matchesStatus =
        statusFilter === "todos" || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, debouncedQuery, statusFilter]);

  const total = filteredClients.length;
  const visibleClients = useMemo(
    () => (showAll ? filteredClients : filteredClients.slice(0, pageSize)),
    [filteredClients, showAll, pageSize]
  );

  useEffect(() => {
    setPageSize(PAGE_STEP);
    setShowAll(false);
  }, [searchTerm, statusFilter, clientOrder]);

  useEffect(() => {
    resetClientItemsByClientId();
  }, [resetClientItemsByClientId]);

  if (!isClientsHydratedByLawyer && isClientsLoadingByLawyer)
    return <LoadingSpinner />;

  if (clientsError)
    return <ErrorScreen message="Ocurrió un error al cargar los clientes" />;

  if (isClientsHydratedByLawyer && clients.length === 0)
    return <EmptyArray title="No hay clientes para mostrar" />;

  return (
    <div className="bg-gradient-to-t from-[#334155] via-[#3b4d66] to-[#60a5fa]/20 min-h-screen">
      {/* Dialog Create Client */}
      <ClientForm
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
              <p className="text-gray-600">
                Gestiona y supervisa todos tus clientes
              </p>
            </div>
          </div>

          <Button
            className="law-gradient hover:opacity-90"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-[hsl(210,100%,45%)] rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {getStatusCount("active")}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Revisión</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {getStatusCount("under_review")}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Inactivos</p>
                <p className="text-2xl font-bold text-gray-600">
                  {getStatusCount("inactive")}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="under_review">En Revisión</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientOrder} onValueChange={setClientOrder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fecha_ascendente">
                  Fecha Actividad Asc.
                </SelectItem>
                <SelectItem value="fecha_descendente">
                  Fecha Actividad Des.
                </SelectItem>
                <SelectItem value="cantidad_cliente">Cantidad Items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
        <div className="flex items-center justify-center py-3 gap-2">
          {!showAll && visibleClients.length < total && (
            <Button
              variant="outline"
              onClick={() => setPageSize((s) => s + PAGE_STEP)}
            >
              Ver más
            </Button>
          )}
          {total > PAGE_STEP && (
            <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Mostrar menos" : "Ver todos"}
            </Button>
          )}
        </div>

        {/* Client Array Empty */}
        {filteredClients.length === 0 && mockClients.length !== 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron clientes
            </h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}

        {/* {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay clientes aún
            </h3>
            <p className="text-gray-600">
              Comienza agregando tu primer cliente
            </p>
            <Button
              className="law-gradient hover:opacity-90 mt-5"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Cliente
            </Button>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ClientsPage;
