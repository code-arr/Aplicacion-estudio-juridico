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

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  fileUrl: string;

  clientId: string;
  clientItemId: string | null; // ➕ nuevo

  createdAt?: Date;
  updatedAt?: Date;

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
