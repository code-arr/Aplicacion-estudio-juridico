// src/pages/dashboard/items/ItemsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ClientItem } from "@/types/ClientItem";
import {
  useClientItemStore,
  selectClientItems,
  selectClientItemsBusy,
  selectIsClientItemsHydrated,
} from "@/store/useClientItemStore";
import ItemForm from "@/components/items/ItemForm";
import ItemCard from "@/components/items/ItemCard";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFocusContext } from "@/hooks/useFocusContext";

type SortKey = "recent" | "creation" | "A_Z";

const safeDate = (v?: string | number | Date) =>
  v ? new Date(v).getTime() : -Infinity;
const cmp = (n: number) => (n < 0 ? -1 : n > 0 ? 1 : 0);
const cmpStr = (a?: string, b?: string) =>
  (a ?? "").localeCompare(b ?? "", "es", { sensitivity: "base" });

const ORDER_CMP: Record<SortKey, (a: ClientItem, b: ClientItem) => number> = {
  recent: (a, b) =>
    cmp(safeDate(b.updatedAt) - safeDate(a.updatedAt)) ||
    cmpStr(a.title, b.title),
  creation: (a, b) =>
    cmp(safeDate(b.createdAt) - safeDate(a.createdAt)) ||
    cmpStr(a.title, b.title),
  A_Z: (a, b) => cmpStr(a.title, b.title),
  /* elements: (a, b) =>
    (b.elementsCount ?? b.elements?.length ?? 0) -
      (a.elementsCount ?? a.elements?.length ?? 0) || cmpStr(a.title, b.title), */
};

const ItemsPage = () => {
  useFocusContext({ type: "LawyerApp", id: "main" });

  const navigate = useNavigate();
  const PAGE_STEP = 10;
  const [pageSize, setPageSize] = useState(PAGE_STEP);
  const [showAll, setShowAll] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [orderBy, setOrderBy] = useState<string>("");

  const clientItems = useClientItemStore(selectClientItems);
  const busy = useClientItemStore(selectClientItemsBusy);
  const hydrated = useClientItemStore(selectIsClientItemsHydrated);

  // Opcional: delay anti-parpadeo
  function useBusyDelay(active: boolean, ms = 200) {
    const [show, setShow] = useState(active);
    useEffect(() => {
      if (active) setShow(true);
      else {
        const id = setTimeout(() => setShow(false), ms);
        return () => clearTimeout(id);
      }
    }, [active, ms]);
    return show;
  }

  const showSpinner = useBusyDelay(busy || !hydrated, 50);

  const filters = useClientItemStore((s) => s.filters);
  const setFilters = useClientItemStore((s) => s.setFilters);

  const filteredClientItems = useMemo((): ClientItem[] => {
    const base = clientItems ?? [];
    const { query = "", status, order } = filters ?? {};
    const q = query.trim().toLowerCase();
    const filtered = base
      .filter((item: ClientItem) => !status || item.status === status)
      .filter((item: ClientItem) => !q || item.title.toLowerCase().includes(q));

    const key: SortKey = (order as SortKey) || "recent";
    return filtered.sort(ORDER_CMP[key]);
  }, [clientItems, filters]);

  const total = filteredClientItems.length;
  const visibleItems = useMemo(
    () =>
      showAll ? filteredClientItems : filteredClientItems.slice(0, pageSize),
    [filteredClientItems, showAll, pageSize]
  );

  const handleViewDetails = useCallback(
    (item: ClientItem) => {
      navigate(`/dashboard/item/${item.id}`);
    },
    [navigate]
  );

  const debouncedQuery = useDebouncedValue(searchTerm, 250);
  useEffect(() => {
    setFilters({
      query: debouncedQuery,
      status: statusFilter === "todos" ? undefined : statusFilter,
      // dejá order undefined si querés mantener el placeholder;
      // en tu derivado seguí usando el fallback a "recent"
      order: orderBy || undefined,
    });
  }, [debouncedQuery, statusFilter, orderBy, setFilters]);

  /*   useEffect(() => {
    setLoading(true);
    if (filteredClientItems.length >= 0) setLoading(false);
  }, [filteredClientItems]); */

  useEffect(() => {
    setPageSize(PAGE_STEP);
    setShowAll(false);
  }, [filters.query, filters.status, filters.order]);

  return (
    <div className=" bg-gradient-to-t from-[#334155] via-[#3b4d66] to-[#60a5fa]/20 min-h-screen">
      <ItemForm isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Items</h1>
              <p className="text-gray-600">
                Accede y organiza todos tus ítems en un solo lugar
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por titulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado del item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value={"open"}>Abierto</SelectItem>
                <SelectItem value={"on_hold"}>En espera</SelectItem>
                <SelectItem value={"closed"}>Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orderBy} onValueChange={setOrderBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Actividad reciente</SelectItem>
                <SelectItem value="creation">Fecha de creacion</SelectItem>
                <SelectItem value="A_Z">Alfabetico</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#0073e6] hover:opacity-90  cursor-pointer"
            >
              <Plus />
              Nuevo Item
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-2">
          {visibleItems.length} de {total} resultados
        </p>
        {/* ClientItem Cards Grid */}
        {showSpinner ? (
          <LoadingSpinner />
        ) : clientItems.length === 0 ? (
          // Caso "no hay ítems en absoluto"
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay ítems aún
            </h3>
            <p className="text-gray-400">Comenzá agregando tu primer ítem</p>
            <Button
              className="bg-[#0073e6] hover:opacity-90 mt-5"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Ítem
            </Button>
          </div>
        ) : filteredClientItems.length === 0 ? (
          // Caso "hay ítems pero filtros no coinciden"
          <p className="text-sm text-gray-900">
            No hay ítems que coincidan con tu búsqueda.
          </p>
        ) : (
          // Caso normal: mostrar cards
          <div className="grid grid-cols-1 pr-10 gap-4">
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center py-3 gap-2">
          {!showAll && visibleItems.length < total && (
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
      </div>
    </div>
  );
};

export default ItemsPage;
