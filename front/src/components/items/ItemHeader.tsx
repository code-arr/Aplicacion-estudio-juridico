// src/components/items/ItemHeader.tsx
import type { ClientItem } from "@/types/ClientItem";
import { CLIENTITEM_STATUS_MAP } from "@/types/ClientItem";
import { Badge } from "@/components/ui/badge";
import {
  selectCategory,
  selectItemType,
  selectSection,
  useCatalogStore,
} from "@/store/useCatalogStore";
import { selectClientDetail, useClientStore } from "@/store/useClientStore";
import {
  SegmentedToggle,
  SegmentedToggleItem,
} from "@/components/ui/segmentedtoggle";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import DocumentForm from "@/components/documents/DocumentForm";
import AudienceForm from "@/components/audiences/AudienceForm";
import ProcessForm from "@/components/processes/ProcessForm";
import { formatDateChileShort } from "@/lib/formatDate";
import { deleteClientItem } from "@/api/clientItem";
import { useClientItemStore } from "@/store/useClientItemStore";
import EditClientItemDialog from "./EditClientItemDialog";
import { useToast } from "@/hooks/useToast";

type Tab = {
  value: string;
  label: string;
};

interface ItemHeaderProps {
  item: ClientItem;
  prevRoute: string | null;
  timer?: string;
}

const ItemHeader = ({ item, prevRoute }: ItemHeaderProps) => {
  const { pathname } = useLocation();
  const { clientItemId } = useParams();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState({
    documentForm: false,
    audienceForm: false,
    processForm: false,
  });
  const [isEditOpen, setEditOpen] = useState(false);
  const { toast } = useToast?.() ?? { toast: () => {} };

  const openOnly = (
    key: "documentForm" | "audienceForm" | "processForm",
    open: boolean
  ) =>
    setIsDialogOpen({
      documentForm: key === "documentForm" && open,
      audienceForm: key === "audienceForm" && open,
      processForm: key === "processForm" && open,
    });

  const setDocumentOpen = (open: boolean) => openOnly("documentForm", open);
  const setAudienceOpen = (open: boolean) => openOnly("audienceForm", open);
  const setProcessOpen = (open: boolean) => openOnly("processForm", open);

  const basePath = `/dashboard/item/${clientItemId}`;
  const currentTab =
    pathname === basePath
      ? "documents"
      : pathname.startsWith(`${basePath}/`)
      ? pathname.slice(basePath.length + 1) // p.ej. "documents"
      : "documents";

  const clientDetail = useClientStore(selectClientDetail);
  const itemType = useCatalogStore(selectItemType(item?.itemTypeId ?? ""));
  const section = useCatalogStore(
    selectSection(
      item?.sectionId
        ? item.sectionId
        : itemType?.sectionId
        ? itemType?.sectionId
        : ""
    )
  );
  const category = useCatalogStore(
    selectCategory(
      item?.categoryId
        ? item.categoryId
        : section?.categoryId
        ? section.categoryId
        : ""
    )
  );

  const handleDelete = async () => {
    const ok = window.confirm(
      "¿Seguro que querés eliminar este ítem? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      await deleteClientItem(clientItemId!);

      const S = useClientItemStore.getState();
      const curAll = S.clientItems ?? null;
      const curByClient = S.clientItemsByClientId ?? null;

      const filterOut = (arr: typeof curAll) =>
        arr ? arr.filter((it: any) => it.id !== clientItemId) : arr;

      // Quitamos de las colecciones y limpiamos detail si corresponde
      useClientItemStore.setState({
        clientItems: filterOut(curAll),
        clientItemsByClientId: filterOut(curByClient),
        clientItemDetail:
          S.clientItemDetail?.id === clientItemId ? null : S.clientItemDetail,
      });

      toast({
        title: "Ítem eliminado",
        description: "Se borró correctamente.",
      });

      // Si estás parado en el detalle, salí
      const isDetail = location.pathname.includes("/dashboard/item/");
      if (isDetail) {
        const back = prevRoute ?? "/dashboard/clientItems";
        navigate(back, { replace: true });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "No se pudo eliminar",
        description: e?.response?.data?.message ?? "Error inesperado",
      });
    }
  };

  const StatusBadge = (status: ClientItem["status"]) => {
    const cfg = CLIENTITEM_STATUS_MAP[status] ?? {
      label: "Desconocido",
      className: "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200",
    };
    return (
      <Badge
        className={`${cfg.className} place-self-start h-fit py-1 rounded-md text-base font-medium cursor-default`}
      >
        {cfg.label}
      </Badge>
    );
  };

  const buildTabs = (categoryName: string | null): Tab[] => {
    const baseTabs: Tab[] = [
      /* { value: "index", label: "Resumen" }, */
      { value: "documents", label: "Documentos" },
      { value: "meetings", label: "Reuniones" },
      { value: "process", label: "Trámites" },
    ];

    if (categoryName === "Judicial") {
      baseTabs.splice(1, 0, { value: "audiences", label: "Audiencias" });
      // ↑ lo meto en la posición 2 (después de "Documentos")
    }

    return baseTabs;
  };

  // Ejemplo
  const tabs = buildTabs(category?.name ?? null);

  const fullName =
    clientDetail?.firstName && clientDetail?.lastName
      ? `${clientDetail.firstName} ${
          clientDetail.lastName.split(" ")[0] ?? ""
        }`.trim()
      : clientDetail?.companyName ?? "";

  return (
    <div className="bg-white py-6 rounded-t-lg">
      <DocumentForm
        isDialogOpen={isDialogOpen.documentForm}
        onOpenChange={setDocumentOpen}
      />
      {category?.name === "Judicial" && (
        <AudienceForm
          isDialogOpen={isDialogOpen.audienceForm}
          onOpenChange={setAudienceOpen}
        />
      )}
      <ProcessForm
        isDialogOpen={isDialogOpen.processForm}
        onOpenChange={setProcessOpen}
      />
      <EditClientItemDialog
        open={isEditOpen}
        onOpenChange={setEditOpen}
        item={item}
      />
      <div className="flex flex-col">
        <div className="flex justify-between gap-x-4 px-8">
          <div className="flex flex-col pb-5 w-1/2 px-2">
            <div className="flex items-center pb-4 gap-x-2">
              <button
                className="cursor-pointer"
                onClick={
                  prevRoute === null
                    ? () => navigate("/dashboard/clientItems")
                    : () => navigate(prevRoute)
                }
              >
                <ArrowLeft />
              </button>
              <p className="text-lg ">
                <span>{category?.name} </span>
                <span>{section ? ` / ${section?.name}` : ""} </span>
                <span>{itemType ? ` / ${itemType?.name}` : ""}</span>
              </p>
            </div>
            <div className="grid items-start gap-x-3 self-start max-w-[32rem]">
              {/* grid-cols-[minmax(40%,1fr)_auto] */}
              <h1 className="text-3xl font-semibold leading-tight">
                {item.title}
              </h1>
              <div className="row-start-1 col-start-2 whitespace-nowrap">
                {StatusBadge(item.status)}
              </div>
            </div>

            <div className="flex gap-x-4 text-lg pt-2">
              <p>
                {"Cliente: "}
                <span className="cursor-pointer text-blue-950">{fullName}</span>
              </p>
              <p>{`Última actualización: ${formatDateChileShort(
                item.updatedAt!
              )}`}</p>
            </div>
          </div>

          <div className="flex items-center gap-x-3 pb-6">
            <Button
              onClick={() => setEditOpen(true)}
              className="bg-[hsl(225,85%,20%)] hover:bg-[hsl(225,85%,16%)] text-base"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="text-base"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
        <div className="px-10 pb-4">
          <h1 className="text-gray-950 text-lg font-medium mb-1.5">
            Descripción
          </h1>
          <p className="capitalize">{item.description}</p>
        </div>
        <div className="border-y-[1.6px] border-gray-200">
          <div className="flex gap-x-2 px-4">
            <SegmentedToggle
              className="bg-transparent py-0"
              type="single"
              value={currentTab}
              onValueChange={(next) => {
                if (!next) return;
                navigate(`${basePath}/${next}`, { state: { prevRoute } });
              }}
              aria-label="Secciones del ítem"
            >
              <div className="flex gap-x-5">
                {tabs.map((tab) => (
                  <div
                    key={tab.value}
                    className="border-b border-transparent transition-colors duration-150 ease-out has-[button[data-state=on]]:border-b-blue-950 has-[button[data-state=on]]:shadow-[0px_1px_0px_0px_blue]"
                  >
                    <SegmentedToggleItem
                      className="bg-transparent! py-2.5 text-lg text-[hsl(225,15%,15%)]/90 transition-colors duration-150 ease-out data-[state=on]:text-black data-[state=on]:font-semibold cursor-pointer"
                      value={tab.value}
                    >
                      {tab.label}
                    </SegmentedToggleItem>
                  </div>
                ))}
              </div>
            </SegmentedToggle>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemHeader;
