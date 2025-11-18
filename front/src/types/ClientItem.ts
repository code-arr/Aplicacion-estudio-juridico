// src/types/ClientItem.ts
export type ClientItemStatus = "open" | "on_hold" | "closed";
export type Currency = "CLP" | "USD" | "UF";

export const CLIENTITEM_STATUS_MAP: Record<
  ClientItemStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Abierto",
    className: "bg-blue-300 hover:bg-blue-400 text-blue-900 border-blue-200",
  },
  on_hold: {
    label: "En Revisión",
    className:
      "bg-yellow-300 hover:bg-yellow-400 text-yellow-900 border-yellow-200",
  },
  closed: {
    label: "Cerrado",
    className:
      "bg-green-300 hover:bg-green-400 text-green-900 border-green-200",
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
  hourlyRateOverride?: string;
  currencyOverride?: Currency;

  isPrivate?: boolean; // <-- Renombrado de 'private' para consistencia con el backend
  lawyerId?: string; // ID del abogado propietario (dueño)

  // Lista de abogados con acceso (si es privado)
  // (El backend necesita ser configurado para devolver esto,
  // probablemente usando 'relations' en el findOne o un 'addSelect' en el queryBuilder)
  sharedWithLawyers?: { id: string; name: string }[];
  // ----------------

  closedAt?: string; // ISO date string
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}
