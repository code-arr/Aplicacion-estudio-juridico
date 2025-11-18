// src/api/clientItem.ts
import type { ClientItem } from "@/types/ClientItem";
import axios from "./axios";

export const getAllClientItems = async (): Promise<ClientItem[]> => {
  return (await axios.get("/clientItem/getAll")).data;
};

export const getClientItemsByLawyerId = async (
  lawyerId: string
): Promise<ClientItem[]> => {
  const { data } = await axios.get(`/clientItem/getByLawyerId/${lawyerId}`);
  return data;
};

export const getClientItemsByClientId = async (
  clientId: string
): Promise<ClientItem[]> => {
  const { data } = await axios.get(`clientItem/getByClientId/${clientId}`);
  return data;
};

export const getRecentClientItems = async (
  limit?: number
): Promise<ClientItem[]> => {
  const { data } = await axios.get("/clientItem/recent");
  return data;
};

export const createClientItem = async (
  clientItem: ClientItem
): Promise<ClientItem> => {
  return (await axios.post("/clientItem/create", clientItem)).data;
};

export const updateClientItem = async (
  id: string,
  clientItem: Partial<ClientItem>
): Promise<ClientItem> => {
  return (await axios.put(`/clientItem/${id}`, clientItem)).data;
};

export const deleteClientItem = async (id: string): Promise<void> => {
  await axios.delete(`/clientItem/delete/${id}`);
};

// --- NUEVA FUNCIÓN ---
export interface AccessPayload {
  isPrivate: boolean;
  sharedLawyerIds: string[];
}

export const updateClientItemAccess = async (
  clientItemId: string,
  payload: AccessPayload
): Promise<ClientItem> => {
  try {
    const { data } = await axios.put(
      `/clientItem/${clientItemId}/access`,
      payload
    );
    return data;
  } catch (error) {
    console.error("Error updating client item access:", error);
    throw error;
  }
};
