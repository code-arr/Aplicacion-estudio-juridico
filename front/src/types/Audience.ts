//src/types/Audience
export interface Audience {
  id: string;
  name: string;
  size: number;
  fileUrl: string;
  dateTime: string; // ISO 8601 UTC
  durationSec?: number;
  mode?: "virtual" | "presencial";

  clientId: string;
  clientItemId: string | null;

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
  clientItemId: string | null;
  versionId?: string;
};
