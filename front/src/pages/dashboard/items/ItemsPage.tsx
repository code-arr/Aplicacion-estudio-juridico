import { useState } from "react";
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

const ItemsPage = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusCategory, setStatusCategory] = useState<string>("todos");
  const categories = useCatalogStore(selectCategories);
  const clientItems = useClientItemStore(selectClientItems);
  console.log(clientItems);

  const handleViewDetails = (item: ClientItem) => {
    console.log("Ver detalles del item:", item.title);
    navigate(`${item.id}`);
  };

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
            <Select value={statusCategory} onValueChange={setStatusCategory}>
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

        {/* ClientItem Cards Grid */}
        <div className="grid grid-cols-1 pr-10 gap-4">
          {clientItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemsPage;
