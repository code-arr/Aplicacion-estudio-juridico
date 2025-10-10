import type { Client } from "@/types/Client";
import axios from "./axios";

export const getClients = async (): Promise<Client[]> => {
  return (await axios.get("/client/getAll")).data;
};

export const getClientsByLawyerId = async (
  lawyerId: string
): Promise<Client[]> => {
  return (await axios.get(`client/getByLawyerId/${lawyerId}`)).data;
};

export const createClient = async (client: Client): Promise<Client> => {
  return (await axios.post("/client/create", client)).data;
};

export const updateClient = async (
  id: string,
  client: Partial<Client>
): Promise<Client> => {
  return (await axios.put(`/client/update/${id}`, client)).data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await axios.delete(`/client/delete/${id}`);
};

export const linkClientToLawyer = async (clientId: string): Promise<void> => {
  return (await axios.post(`/client/link/`, clientId)).data;
};
