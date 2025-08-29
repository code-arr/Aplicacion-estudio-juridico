import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ClientItem } from "@/types/ClientItem";
import { selectCategories, useCatalogStore } from "@/store/useCatalogStore";
import {
  useClientItemStore,
  selectClientItems,
} from "@/store/useClientItemStore";
import ItemForm from "@components/items/ItemForm";
import ItemCard from "@components/items/ItemCard";
import { SidebarTrigger } from "@components/ui/sidebar";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Button } from "@components/ui/button";
import { Plus, Search } from "lucide-react";

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
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  /*   const [categoryFilter, setCategoryFilter] = useState<string>("todos"); */
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [orderBy, setOrderBy] = useState<string>("");
  /*  const categories = useCatalogStore(selectCategories); */
  const clientItems = useClientItemStore(selectClientItems);
  console.log(clientItems);

  /*   const filteredClientItems = useClientItemStore(selectClientItemsByFilters); */
  const filters = useClientItemStore((s) => s.filters);
  const setFilters = useClientItemStore((s) => s.setFilters);

  const handleViewDetails = (item: ClientItem) => {
    navigate(`/dashboard/item/${item.id}`);
  };

  const filteredClientItems = useMemo((): ClientItem[] => {
    const base = clientItems ?? [];
    const { query, status, order } = filters ?? {};
    const q = query.trim().toLowerCase();
    const filtered = base
      .filter((item: ClientItem) => !status || item.status === status)
      .filter((item: ClientItem) => !q || item.title.toLowerCase().includes(q));

    const key: SortKey = (order as SortKey) || "recent";
    return filtered.sort(ORDER_CMP[key]);
  }, [clientItems, filters]);

  useEffect(() => {
    setFilters({
      query: searchTerm,
      status: statusFilter === "todos" ? undefined : statusFilter,
      order: orderBy,
    });
  }, [setFilters, searchTerm, statusFilter, orderBy]);

  return (
    <div>
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
                {/* <SelectItem value="elements">Cantidad de elementos</SelectItem> */}
              </SelectContent>
            </Select>
            {/* <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorias</SelectItem>
                {categories.map((cateogry) => (
                  <SelectItem key={cateogry.id} value={cateogry.name}>
                    {cateogry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#0073e6] hover:opacity-90  cursor-pointer"
            >
              <Plus />
              Nuevo Item
            </Button>
          </div>
        </div>

        {/* ClientItem Cards Grid */}
        <div className="grid grid-cols-1 pr-10 gap-4">
          {filteredClientItems.map((item) => {
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
    </div>
  );
};

export default ItemsPage;
