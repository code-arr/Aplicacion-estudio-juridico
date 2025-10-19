export interface Process {
  id?: string;
  name: string;
  description?: string;
  durationSec: null | number;
  dateTime: string; // ISO 8601

  createdAt?: string;
  updatedAt?: string;
}
