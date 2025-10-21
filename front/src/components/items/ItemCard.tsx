import { useState, memo } from "react";
import type { ClientItem } from "@/types/ClientItem";
import { CLIENTITEM_STATUS_MAP } from "@/types/ClientItem";
import { selectClientName, useClientStore } from "@/store/useClientStore";
import {
  selectCategory,
  selectItemType,
  selectSection,
  useCatalogStore,
} from "@/store/useCatalogStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdownMenu";
import {
  Scale,
  Landmark,
  FolderOpen,
  ClipboardList,
  AlignJustify,
  Library,
  EllipsisVertical,
} from "lucide-react";

interface ItemCardProps {
  item: ClientItem;
  onViewDetails: (item: ClientItem) => void;
}

const ItemCard = ({ item, onViewDetails }: ItemCardProps) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const clientName = useClientStore(selectClientName(item.clientId));

  const itemType = useCatalogStore(selectItemType(item.itemTypeId ?? ""));
  const section = useCatalogStore(
    selectSection(
      item.sectionId
        ? item.sectionId
        : itemType?.sectionId
        ? itemType?.sectionId
        : ""
    )
  );
  const category = useCatalogStore(
    selectCategory(
      item.categoryId
        ? item.categoryId
        : section?.categoryId
        ? section.categoryId
        : ""
    )
  );

  const StatusBadge = (status: ClientItem["status"]) => {
    if (!status) return null;
    const cfg = CLIENTITEM_STATUS_MAP[status] ?? {
      label: "Desconocido",
      className: "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200",
    };
    return (
      <Badge
        className={`${cfg.className} flex gap-x-1 rounded-xl font-semibold cursor-default`}
      >
        <span className="text-2xl pb-[0.17rem]">
          {status === "closed" ? "✓" : "●"}
        </span>
        {cfg.label}
      </Badge>
    );
  };

  const getCardIcon = (categoryName: string | undefined) => {
    switch (categoryName) {
      case "Judicial":
        return <Scale className="w-8 h-8 text-gray-700" />;
        break;
      case "Corporativo":
        return <Landmark className="w-8 h-8 text-gray-700" />;
        break;
      case "Compliance":
        return <ClipboardList className="w-8 h-8 text-gray-700" />;
        break;
      case "Procesos administrativos":
        return <FolderOpen className="w-8 h-8 text-gray-700" />;
        break;
      case "Informes":
        return <Library className="w-8 h-8 text-gray-700" />;
        break;
      default:
        <AlignJustify className="w-8 h-8 text-gray-700" />;
        break;
    }
  };

  return (
    <Card className="shadow-none hover:shadow-sm transition-shadow duration-200 border border-gray-200 bg-white">
      <CardContent className="flex pb-2 pt-4 justify-between cursor-default">
        <div className="flex w-[80%] gap-6" onClick={() => onViewDetails(item)}>
          <div className="p-2.5 mt-1.5 h-fit bg-gray-100 rounded-md">
            {getCardIcon(category?.name)}
          </div>
          <div className="flex flex-col capitalize pt-0.5">
            <h1 className="text-lg font-semibold mb-1.5">{item.title}</h1>
            <p className="mb-0.5 text-gray-800">
              {"Cliente: " + (clientName ? clientName : "-")}
            </p>
            <p className="text-gray-800">
              {`Cateogría: ${category?.name}`}{" "}
              {section ? ` → ${section?.name}` : null}
            </p>
          </div>
        </div>
        <div className="flex flex-col w-[20%] items-end gap-5">
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Opciones del ítem"
                className="p-1.5 rounded-md hover:bg-gray-100 leading-none"
              >
                <EllipsisVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              size="1"
              variant="soft"
              align="end"
              sideOffset={6}
            >
              <DropdownMenuItem
                onSelect={() => onViewDetails(item)}
                shortcut="Enter"
              >
                Ver detalles
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => {
                  // Abrí tu modal de edición o navegá a la ruta de edición
                  // openEditModal(item.id) / navigate(...)
                }}
                shortcut="⌘ E"
              >
                Editar
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  // Confirmación y borrado
                  // confirmDelete(item.id)
                }}
                color="crimson"
                shortcut="⌘ ⌫"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
          <div className="flex flex-col items-end gap-1">
            {StatusBadge(item.status)}
            <p className="text-sm text-gray-500">
              {item.updatedAt
                ? `Última actualización: ${item.updatedAt}`
                : `Creado: ${item.createdAt}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(ItemCard);
