// src/types/Client.ts
import type { Lawyer } from "./Lawyer";

export type ClientType = "Juridica" | "Fisica";
export type ClientStatus = "active" | "inactive" | "under_review";

export const CLIENT_STATUS_MAP: Record<
  ClientStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Activo",
    className: "bg-green-600 hover:bg-green-600/90 text-white border-green-200",
  },
  under_review: {
    label: "En Revisión",
    className:
      "bg-yellow-500 hover:bg-yellow-500/90 text-white border-yellow-200",
  },
  inactive: {
    label: "Inactivo",
    className: "bg-red-500 hover:bg-red-500/90 text-white border-green-500",
  },
};

export interface Client {
  id?: string;
  type: ClientType;
  status?: ClientStatus;
  rut: string;
  email: string;
  phone?: string;
  address?: string;
  profileImage?: string;

  //Persona física
  firstName?: string;
  lastName?: string;

  //Persona jurídica
  companyName?: string;
  legalRepresentative?: string;

  createAt?: string; // ISO date string
  updateAt?: string;

  // Jerarquía
  motherId?: string; // Para corporaciones dependientes de otra

  lawyers?: Lawyer[];
}
