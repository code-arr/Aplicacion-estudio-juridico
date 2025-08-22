import type { ClientItem } from "@/types/ClientItem";
import { CLIENTITEM_STATUS_MAP } from "@/types/ClientItem";
import { Badge } from "@components/ui/badge";
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
} from "@components/ui/segmentedtoggle";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

interface ItemHeaderProps {
  item: ClientItem;
  onBack?: () => void;
  timer?: string;
}

const ItemHeader = ({ item }: ItemHeaderProps) => {
  const { pathname } = useLocation();
  const { clientItemId } = useParams();
  const navigate = useNavigate();
  /* const { clientItemId, "*": tab } = useParams(); */
  /* const currentTab = tab ?? ""; // "" = index (Resumen) */
  const basePath = `/dashboard/item/${clientItemId}`;
  const currentTab = pathname.startsWith(`${basePath}/`)
    ? pathname.slice(basePath.length + 1) // p.ej. "documents"
    : "index";
  const clientDetail = useClientStore(selectClientDetail);
  const itemType = useCatalogStore(selectItemType(item.itemTypeId));
  const section = useCatalogStore(
    selectSection(itemType?.sectionId ? itemType.sectionId : "")
  );
  const category = useCatalogStore(
    selectCategory(section?.categoryId ? section?.categoryId : "")
  );

  const StatusBadge = (status: ClientItem["status"]) => {
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

  const tabs = [
    { value: "index", label: "Resumen" },
    { value: "documents", label: "Documentos" },
    { value: "audiences", label: "Audiencias" },
    { value: "meetings", label: "Reuniones" },
    { value: "process", label: "Trámites" }, // nombre de ruta debe coincidir con tu <Route path="process" />
  ];

  const fullName =
    clientDetail?.firstName && clientDetail?.lastName
      ? `${clientDetail.firstName} ${
          clientDetail.lastName.split(" ")[0] ?? ""
        }`.trim()
      : clientDetail?.companyName ?? "";

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex gap-x-4">
          <div className="flex flex-col">
            <p>{`${name} / ${category} / ${section} / ${itemType}`}</p>
            <div>
              <h1>{item.title}</h1>
              {StatusBadge(item.status)}
            </div>
            <div>
              <p>{`Cliente:  ${fullName}`}</p>
              <p>{`Ultima actualizacion: ${item.updatedAt}`}</p>
            </div>
          </div>
          <div></div>
        </div>
        <div className="flex gap-x-2">
          <SegmentedToggle
            type="single"
            value={currentTab}
            onValueChange={(next) => {
              if (next == null) return;
              navigate(next === "index" ? basePath : `${basePath}/${next}`);
            }}
            aria-label="Secciones del ítem"
          >
            {tabs.map((tab) => (
              <SegmentedToggleItem key={tab.value} value={tab.value}>
                {tab.label}
              </SegmentedToggleItem>
            ))}
          </SegmentedToggle>
        </div>
      </div>
    </div>
  );
};

export default ItemHeader;
