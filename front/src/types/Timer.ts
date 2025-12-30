// src/types/Timer.ts
// Dominios y constantes base (compartidos por todo)
export type TrackableType =
  | "LawyerApp"
  | "Client"
  /*   | "ClientItem" */
  | "Document"
  | "Audience"
  | "Meeting"
  | "Process";

export type PauseReason = "idle" | "switch" | "close" | "logout" | "suspend";
export type TimerStatus = "running" | "paused" | "stopped";

export type Trackable = {
  type: TrackableType;
  id: string;
  clientId?: string;
  clientItemId?: string;
};

export type TimeEntry = {
  id: string; // UUID (idempotencia)
  trackableType: TrackableType;
  trackableId: string;
  lawyerId: string;
  clientId?: string;
  clientItemId?: string;
  dayKey: string; //YYYY-MM-DD del inicio
  startedAtUTC: string; // ISO
  endedAtUTC: string; // ISO
  durationSec: number; // redondeado a enteros
  pauseReason: PauseReason;
  appVersion?: string;
};

// Constantes
export const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 min
export const IDLE_LIMIT_SEC = Math.floor(IDLE_LIMIT_MS / 1000);

export const MIN_SEGMENT_SEC = 10;

// Payloads/eventos internos (opcional)
export type StartContextPayload = {
  trackable: Trackable;
  source?: "auto" | "switch";
};
export type PauseContextPayload = { reason: PauseReason };
