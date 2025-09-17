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
