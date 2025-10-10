import type { Document } from "@/types/Document";
import axios from "./axios";

export const getAllDocuments = async (): Promise<Document[]> => {
  return (await axios.get("document/getAll")).data;
};

export const getDocumentsByClientItem = async (
  itemId: string
): Promise<Document[]> => {
  return (await axios.get(`document/getByClientItemId/${itemId}`)).data;
};

export const createDocument = async (
  newDocument: FormData,
  clientItemId: string
): Promise<Document> => {
  return (await axios.post(`document/create/${clientItemId}`, newDocument))
    .data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  return (await axios.delete(`document/delete/${documentId}`)).data;
};
