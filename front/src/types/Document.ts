export type DocumentType =
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "ppt"
  | "pptx"
  | "txt"
  | "jpg"
  | "png";

export interface DocumentVersion {
  id: string;
  documentId?: string;
  versionNumber: number;
  fileUrl: string;
  mimeType?: string | null;
  size?: number | null;
  uploadedBy?: string | null; // uuid
  lawyer?: { id: string; firstName?: string; lastName?: string } | null;
  createdAt: string; // YYYY-MM-DDTHH:mm:... (llega del backend)
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size?: number;
  fileUrl?: string;
  clientId: string;
  clientItemId: string | null;
  createdAt?: string;
  updatedAt?: string;
  currentVersion?: number;
  versions?: DocumentVersion[]; // arreglo de versiones (si el backend lo devuelve)
  tags?: string[];
  status?: "draft" | "final" | "archived";
}

export type OpenDoc = {
  id: string;
  title: string;
  url: string;
  clientId: string;
  clientItemId: string | null; // ➕ nuevo
  versionId?: string;
};
