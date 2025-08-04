import type { Case } from "./Case";
import type { Lawyer } from "./Lawyer";

export type ClientType = "juridica" | "fisica";
export type ClientStatus = "activo" | "inactivo" | "en_revision";

export interface Client {
  id: string;
  type: ClientType;
  clientStatus: ClientStatus;
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

  cases?: Case[];
  lawyers?: Lawyer[];
}
