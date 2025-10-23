// src/api/document.ts
import type { Document } from "@/types/Document";
import axios from "./axios";

export const getAllDocuments = async (): Promise<Document[]> => {
  return (await axios.get("document/getAll")).data;
};

export const getDocumentsByClientItem = async (
  itemId: string
): Promise<Document[]> => {
  const data = (await axios.get(`document/getByClientItemId/${itemId}`)).data;
  console.log(data);
  return data;
};

export const createDocument = async (
  newDocument: FormData,
  clientItemId: string
): Promise<Document> => {
  return (await axios.post(`document/create/${clientItemId}`, newDocument))
    .data;
};

export const deleteDocument = async (
  documentId: string,
  fileUrl: string
): Promise<Document> => {
  return (
    await axios.delete(`document/delete/${documentId}`, {
      data: { fileUrl },
    })
  ).data;
};
