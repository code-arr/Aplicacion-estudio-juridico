// src/api/document.ts
import type { Document, DocumentVersion } from "@/types/Document";
import axios from "./axios";

export const getAllDocuments = async (): Promise<Document[]> => {
  return (await axios.get("document/getAll")).data;
};

export const getDocumentsByClientItem = async (
  itemId: string
): Promise<Document[]> => {
  const data = (await axios.get(`document/getByClientItemId/${itemId}`)).data;
  return data;
};

export const getVersionsByDocumentId = async (
  documentId: string
): Promise<DocumentVersion[]> => {
  // Llamar a /document/:documentId/versions (back actual)
  const { data } = await axios.get(`document/${documentId}/versions`);
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

// Reusar createDocument para subir nueva versión.
// newForm must include: name (igual al document.name), file, clientId
export const uploadNewVersion = async (
  form: FormData,
  clientItemId: string
): Promise<Document> => {
  // backend: POST document/create/:clientItemId -> crea doc o crea versión
  return (await axios.post(`document/create/${clientItemId}`, form)).data;
};

export const deleteVersion = async (
  documentId: string,
  versionId: string
): Promise<{ document: Document }> => {
  return (await axios.delete(`document/version/${documentId}/${versionId}`))
    .data;
};

export const updateDocument = async (
  documentId: string,
  newName: string
): Promise<void> => {
  return (await axios.put(`document/${documentId}`, { newName })).data;
};

export const deleteDocument = async (
  documentId: string,
  fileUrl: string
): Promise<Document> => {
  return (
    await axios.delete(`document/${documentId}`, {
      data: { fileUrl },
    })
  ).data;
};
