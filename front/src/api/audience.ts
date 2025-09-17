import type { Audience } from "@/types/Audience";
import axios from "./axios";
/* import type { HeartbeatEntry } from "../../electron/store/timeBufferStore"; */

export const getAllAudiences = async (): Promise<Audience[]> => {
  return (await axios.get("audience/getAll")).data;
};

export const getAudiencesByClientItem = async (
  itemId: string
): Promise<Audience[]> => {
  return (await axios.get(`audience/getByClientItemId/${itemId}`)).data;
};
