// src/types/ClientItem.ts
export type ClientItemStatus = "open" | "on_hold" | "closed";

export const CLIENTITEM_STATUS_MAP: Record<
  ClientItemStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Abierto",
    className: "bg-[#0073e6] hover:bg-[#0073e6]/95 text-white border-blue-200",
  },
  on_hold: {
    label: "En Revisión",
    className:
      "bg-yellow-100 hover:bg-yellow-100/95 text-white border-yellow-200",
  },
  closed: {
    label: "Cerrado",
    className: "bg-green-100 hover:bg-green-100/95 text-white border-green-200",
  },
};

export interface ClientItem {
  id?: string;
  categoryId?: string;
  sectionId?: string;
  itemTypeId?: string;
  clientId: string;
  title: string;
  description?: string;
  status?: ClientItemStatus;

  createAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}
