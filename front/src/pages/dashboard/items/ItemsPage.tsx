import { useState } from "react";
import ItemForm from "@components/items/ItemForm";
import { SidebarTrigger } from "@components/ui/sidebar";
import { Plus, Search, SquarePlus } from "lucide-react";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Button } from "@components/ui/button";

const ItemsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusCategory, setStatusCategory] = useState<string>("todos");
  return (
    <div>
      <ItemForm isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
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
              <SelectItem value="activo">Judicial</SelectItem>
              <SelectItem value="en_revision">Corporativo</SelectItem>
              <SelectItem value="inactivo">Compliance</SelectItem>
              <SelectItem value="inactivo">Procesos Administrativos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="law-gradient hover:opacity-90  cursor-pointer"
          >
            <Plus />
            Nuevo Item
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ItemsPage;
