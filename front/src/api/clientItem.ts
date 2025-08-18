import type { ClientItem } from "@/types/ClientItem";
import axios from "./axios";

export const getClientItemsData = async (): Promise<ClientItem[]> => {
  return await axios.get("/clientItem/getAll");
};

export const getRecentClientItemsData = async (
  limit?: number
): Promise<ClientItem[]> => {
  return await axios.get("/clientItem/recent");
};

export const getClientItemsByClientId = async (
  clientId: string
): Promise<ClientItem[]> => {
  return await axios.get(`clientItem/client/${clientId}`);
};
