import type { Document } from "@/types/Document";
import axios from "./axios";
/* import type { HeartbeatEntry } from "../../electron/store/timeBufferStore"; */

export const getAllDocuments = async (): Promise<Document[]> => {
  return (await axios.get("document/getAll")).data;
};

export const getDocumentsByClientItem = async (
  itemId: string
): Promise<Document[]> => {
  return (await axios.get(`document/getByClientItemId/${itemId}`)).data;
};

/* export const updateDocumentActiveTime = async (entry: HeartbeatEntry) => {
  return await axios.put(`document/${entry.docId}/updateActiveTime`, {
    activeTime: entry.deltaSec,
  });
}; */
