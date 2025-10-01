export type MeetingType = "google-meet" | "in-person";
export type MeetingStatus = "scheduled" | "completed" | "canceled";
export type Participant = { name: string; email: string };

export interface Meeting {
  id?: string;
  name: string;
  notes?: string;
  type: MeetingType;
  participants: Participant[];
  location?: string; // solo para in-person
  link?: string; // solo para google-meet
  startAt: string; // ISO 8601
  endAt?: string; // ISO 8601
  durationSec?: number; // en segundos
  status: MeetingStatus;
  createAt: string; // ISO 8601
  updateAt: string; // ISO 8601
}
