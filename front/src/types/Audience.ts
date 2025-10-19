//src/types/Audience
export interface Audience {
  id: string;
  name: string;
  size: number;
  fileUrl: string;
  pages?: number;
  date?: string;

  clientId: string;

  updatedAt?: Date;
  createdAt?: Date;

  tags?: string[];
  status?: "draft" | "final" | "archived";
}

export type OpenAud = {
  id: string;
  title: string;
  url: string;
  clientId: string;
  versionId?: string;
};
