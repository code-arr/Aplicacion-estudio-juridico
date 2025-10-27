import axios from "./axios";
import type { Lawyer } from "@/types/Lawyer";

export const getLawyerByEmail = async (email: string): Promise<Lawyer> => {
  try {
    const response = await axios.get(`/lawyer/getByEmail/${email}`);
    return response.data;
  } catch (error) {
    console.log("No se encontro un abogado con ese email:", error);
    throw error;
  }
};

export const getAllLawyers = async () => {
  const { data } = await axios.get("lawyer/getAll");
  return data;
};

export const updateLawyer = async (
  data: Partial<Lawyer>,
  lawyerId?: string
) => {
  return (await axios.put(`lawyer`, { data }, { params: lawyerId })).data;
};

export const removeClient = async (clientId: string) => {
  return (await axios.delete(`lawyer/deleteClient/${clientId}`)).data;
};
