import type { Client } from "@/types/Client";
import axios from "./axios";

export const getClientsData = async (): Promise<Client[]> => {
  return (await axios.get("/client/getAll")).data;
};
