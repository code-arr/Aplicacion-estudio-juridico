export interface Audience {
  id: string;
  name: string;
  size: number;
  fileUrl: string;
  pages?: number;
  date?: string;

  uploadedAt?: Date;
  createdAt?: Date;

  tags?: string[];
  status?: "draft" | "final" | "archived";
}

export type OpenAud = {
  id: string;
  title: string;
  url: string;
  versionId?: string;
};

/* export type AudienceType =
  | "preliminar"
  | "conciliación"
  | "prueba"
  | "sentencia"
  | "otra";

export type AudienceOutcome =
  | "pendiente"
  | "acordada"
  | "fallida"
  | "sentencia"
  | "otra";

export interface ItemAudience {
  id: string;
  itemId: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  pdfUrl: string;
  pages?: number;
  court?: string;
  type?: AudienceType;
  outcome?: AudienceOutcome;
  summary?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
} */
