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

  updateAt?: Date;
  createAt?: Date;

  tags?: string[];
  status?: "draft" | "final" | "archived";
}

export type OpenDoc = {
  id: string;
  title: string;
  url: string;
  clientId: string;
  versionId?: string;
};
