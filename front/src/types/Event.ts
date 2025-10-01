import type { Lawyer } from "./Lawyer";

export type ACTION = "";

export interface Event {
  id?: string;
  entityId: string;
  entityName: string;
  entityType: string;
  action: string;
  createdAt?: string;

  lawyer?: Lawyer;
}
