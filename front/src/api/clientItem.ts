import type { ClientItem } from "@/types/ClientItem";
import axios from "./axios";

export const getClientItemsData = async (): Promise<ClientItem[]> => {
  return (await axios.get("/clientItem/getAll")).data;
};

export const getRecentClientItemsData = async (
  limit?: number
): Promise<ClientItem[]> => {
  return (await axios.get("/clientItem/recent")).data;
};

export const getClientItemsByClientId = async (
  clientId: string
): Promise<ClientItem[]> => {
  return (await axios.get(`clientItem/client/${clientId}`)).data;
};
