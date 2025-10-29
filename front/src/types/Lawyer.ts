// src/types/Lawyer.ts
/* type lawyerType = "criminal" |  */
import type { Client } from "./Client";
import type { User } from "./User";

export interface Lawyer {
  id: string;
  firstName: string;
  lastName: string;
  adress: string;
  phone: string;
  rut: string;
  type: string; //Despues se podria cambiar por un enum
  /* seniorityLevel: string; */
  workedHours: number;

  createdAt: string;
  updatedAt: string;

  user?: User;
  clients?: Client[];
}
