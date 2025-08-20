import type { Lawyer } from "./Lawyer";

export type ClientType = "Juridica" | "Fisica";
export type ClientStatus = "active" | "inactive" | "under_review";

export interface Client {
  id: string;
  type: ClientType;
  status: ClientStatus;
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

  createdAt: string; // ISO date string
  updatedAt: string;

  // Jerarquía
  motherId?: string; // Para corporaciones dependientes de otra

  lawyers?: Lawyer[];
}
