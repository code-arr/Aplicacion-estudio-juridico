import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ClientCard from "@components/clients/ClientCard";

import { mockClients } from "@/mocks/mockClients";

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

import { Search, Plus } from "lucide-react";
import type { Client } from "@/types/Client";
import ClientForm from "@/components/clients/ClientForm";

const ClientsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [clientOrder, setClientOrder] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredClients = mockClients.filter((client) => {
    const matchesSearch =
      client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "todos" || client.clientStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (client: Client) => {
    console.log("Ver detalles del cliente:", client.firstName);
    navigate(`${client.id}`);
  };

  const getStatusCount = (status: Client["clientStatus"]) => {
    return mockClients.filter((client) => client.clientStatus === status)
      .length;
  };

  return (
    <div>
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
                Gestiona y supervisa todos tus casos
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
                  {mockClients.length}
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
                  {getStatusCount("activo")}
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
                  {getStatusCount("en_revision")}
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
                  {getStatusCount("inactivo")}
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
                placeholder="Buscar por nombre o tipo de caso..."
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
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="en_revision">En Revisión</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientOrder} onValueChange={setClientOrder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fecha_ascendente">
                  Fecha Ascendente
                </SelectItem>
                <SelectItem value="fecha_descendente">
                  Fecha Descendente
                </SelectItem>
                <SelectItem value="cantidad_cliente">
                  Cantidad Clientes
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onViewDetails={handleViewDetails}
            />
          ))}
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

        {mockClients.length === 0 && (
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
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
