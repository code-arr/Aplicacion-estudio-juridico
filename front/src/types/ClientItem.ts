/* import type { ItemType } from "./Catalog";
import type { Client } from "./Client"; */

export interface ClientItem {
  id: string;
  itemTypeId: string;
  clientId: string;
  title: string;
  description?: string;
  status?: "open" | "on_hold" | "closed";

  documents: Document[];

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
