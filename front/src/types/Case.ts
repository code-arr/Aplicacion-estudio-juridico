import type { Client } from "./Client";
import type { Lawyer } from "./Lawyer";

export interface Case {
  id: string;
  title: string;
  description: string;
  documents: string[] | null;
  meetings: string[] | null;
  client?: Client;
  lawyers?: Lawyer[];
}
