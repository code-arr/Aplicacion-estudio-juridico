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
