import type { ClientItem } from "@/types/ClientItem";
import axios from "./axios";

export const getAllClientItems = async (): Promise<ClientItem[]> => {
  return (await axios.get("/clientItem/getAll")).data;
};

export const getClientItemsByLawyerId = async (
  lawyerId: string
): Promise<ClientItem[]> => {
  return (await axios.get(`/clientItem/getByLawyerId/${lawyerId}`)).data;
};

export const getClientItemsByClientId = async (
  clientId: string
): Promise<ClientItem[]> => {
  return (await axios.get(`clientItem/getByClientId/${clientId}`)).data;
};

export const getRecentClientItems = async (
  limit?: number
): Promise<ClientItem[]> => {
  return (await axios.get("/clientItem/recent")).data;
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
