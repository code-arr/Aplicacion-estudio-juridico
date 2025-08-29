/* type lawyerType = "criminal" |  */
import type { Client } from "./Client";
import type { User } from "./User";

export interface Lawyer {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  rut: string;
  lawyerType: string; //Despues se podria cambiar por un enum
  seniorityLevel: string;
  hoursWorked: number;
  user?: User;
  clients?: Client[];
}
