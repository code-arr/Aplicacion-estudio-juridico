import type { Audience } from "@/types/Audience";
import axios from "./axios";

export const getAllAudiences = async (): Promise<Audience[]> => {
  return (await axios.get("audience/getAll")).data;
};

export const getAudiencesByClientItem = async (
  itemId: string
): Promise<Audience[]> => {
  return (await axios.get(`audience/getByClientItemId/${itemId}`)).data;
};

export const createAudience = async (
  newAudience: FormData,
  clientItemId: string
): Promise<Audience> => {
  return (await axios.post(`audience/create/${clientItemId}`, newAudience))
    .data;
};

export const deleteAudience = async (audienceId: string): Promise<void> => {
  return (await axios.delete(`audience/delete/${audienceId}`)).data;
};
