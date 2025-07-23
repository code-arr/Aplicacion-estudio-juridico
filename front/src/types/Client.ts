export type ClientStatus = "activo" | "inactivo" | "en revision";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuitCuil?: string; // opcional
  phone: string;
  email: string;
  address?: string;
  profileImage?: string;
  clientStatus: ClientStatus;
  createdAt: string; // ISO date string
  updatedAt: string;
}
