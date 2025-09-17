export type MeetingType = "google-meet" | "in-person";
export type MeetingStatus = "scheduled" | "completed" | "canceled";
export type Participant = { name: string; email: string };

export interface Meeting {
  id?: string;
  name: string;
  description?: string;
  type: MeetingType;
  participants: Participant[];
  location?: string; // solo para in-person
  meetLink?: string; // solo para google-meet
  startAt: string; // ISO 8601
  endAt?: string; // ISO 8601
  durationSec?: number; // en segundos
  status: MeetingStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
