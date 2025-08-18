import type { ClientItem } from "./ClientItem";

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
  uploadedAt: Date;
  uploadedBy?: string;

  version: number;

  tags?: string[];
  status?: "draft" | "final" | "archived";

  clientItem: ClientItem;
}
