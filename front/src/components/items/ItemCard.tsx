import { useState, memo } from "react";
import type { ClientItem } from "@/types/ClientItem";
import { CLIENTITEM_STATUS_MAP } from "@/types/ClientItem";
/* import {
  selectClientFromCacheById,
  useClientStore,
} from "@/store/useClientStore"; */
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
  UserPlus,
} from "lucide-react";
import { formatDateChileShort } from "@/lib/formatDate";
import { useLocation, useNavigate } from "react-router-dom";
import { deleteClientItem } from "@/api/clientItem";
import { useClientItemStore } from "@/store/useClientItemStore";
import { useToast } from "@/hooks/useToast";
import { PermissionsModal } from "./PermissionsModal";

interface ItemCardProps {
  item: ClientItem;
  onViewDetails: (item: ClientItem) => void;
}

const ItemCard = ({ item, onViewDetails }: ItemCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  /*   const clientById = useClientStore((s) =>
    selectClientFromCacheById(s, item.clientId)
  ); */

  // ✅ USÁ ESTO (Dato directo del prop):
  // Usamos el objeto 'client' que ahora viene dentro del 'item'
  const clientObj = item.client;

  const clientName = clientObj
    ? clientObj.type === "Juridica"
      ? clientObj.companyName
      : `${clientObj.firstName} ${clientObj.lastName}`
    : "-"; // Si el backend no mandó nada o es huérfano, mostramos guion

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
  const { toast } = useToast?.() ?? { toast: () => {} };

  const handleDelete = async () => {
    const ok = window.confirm(
      "¿Seguro que querés eliminar este ítem? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      await deleteClientItem(item.id!);

      const S = useClientItemStore.getState();
      const curAll = S.clientItems ?? null;
      const curByClient = S.clientItemsByClientId ?? null;

      const filterOut = (arr: typeof curAll) =>
        arr ? arr.filter((it: any) => it.id !== item.id) : arr;

      // Quitamos de las colecciones y limpiamos detail si corresponde
      useClientItemStore.setState({
        clientItems: filterOut(curAll),
        clientItemsByClientId: filterOut(curByClient),
        clientItemDetail:
          S.clientItemDetail?.id === item.id ? null : S.clientItemDetail,
      });

      toast({
        title: "Ítem eliminado",
        description: "Se borró correctamente.",
      });

      // Si estás parado en el detalle, salí
      const isDetail = location.pathname.includes("/dashboard/item/");
      if (isDetail) {
        navigate("/dashboard/clientItems", { replace: true });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "No se pudo eliminar",
        description: e?.response?.data?.message ?? "Error inesperado",
      });
    }
  };

  const StatusBadge = memo(({ status }: { status?: ClientItem["status"] }) => {
    if (!status) return null;
    const cfg = CLIENTITEM_STATUS_MAP[status] ?? {
      label: "Desconocido",
      className: "bg-gray-100 hover:bg-gray-200 text-gray-800",
    };
    return (
      <Badge className={`${cfg.className} font-medium py-2 cursor-default`}>
        <span className="leading-none">{cfg.label}</span>
      </Badge>
    );
  });

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
        return <AlignJustify className="w-8 h-8 text-gray-700" />;
        break;
    }
  };

  return (
    <>
      <Card className="shadow-none hover:shadow-sm transition-shadow duration-200 border border-gray-200 bg-white">
        <CardContent className="flex pb-2 pt-4 justify-between cursor-default">
          <div
            className="flex w-[80%] gap-6"
            onClick={() => onViewDetails(item)}
          >
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
                  onSelect={() => setIsModalOpen(true)}
                  shortcut="Enter"
                >
                  <span className="flex items-center gap-x-1.5">
                    <UserPlus className="w-4 h-4" />
                    Compartir
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={handleDelete}
                  color="crimson"
                  shortcut="⌘ ⌫"
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuRoot>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={item.status} />
              <p className="text-sm text-gray-500">
                {item.updatedAt
                  ? `Actualizado: ${formatDateChileShort(item.updatedAt)}`
                  : `Creado: ${formatDateChileShort(item.createdAt!)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PermissionsModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default memo(ItemCard);
