type UUID = string;
export type TrackableType =
  | "Lawyer"
  | "Client"
  | "ClientItem"
  | "Document"
  | "Audience"
  | "Meeting"
  | "Process";
export type TimerStatus = "running" | "paused" | "stopped";
export type PauseReason = "idle" | "switch" | "close" | "manual";

// Una entrada de tiempo (time entry) representa un bloque de tiempo dedicado a una actividad específica.
// Puede estar asociada a diferentes tipos de entidades (trackables) como abogados, clientes, documentos, etc.
export interface TimeEntry {
  id?: UUID;
  trackableType: TrackableType;
  trackableId: UUID;
  lawyerId?: UUID; // quién hizo la actividad
  startedAt: string; // ISO (guardá en UTC)
  endedAt?: string | null; // null si sigue corriendo
  durationSec?: number | null; // redundante; lo calculás al cerrar
  source: "auto" | "manual"; // auto (detector de actividad) o manual (usuario)

  derivedFromEntryId?: UUID | null; // si es una atribución derivada
}

// Un timer representa el estado actual del seguimiento de tiempo para una entidad específica.
// Solo puede haber un timer "running" por abogado a la vez.
// El timer puede estar en estado "running", "paused" o "stopped".
export interface TimerState {
  id: UUID;
  trackableType: TrackableType;
  trackableId: UUID;
  lawyerId: UUID;

  status: TimerStatus;
  currentEntryId?: UUID | null; // la TimeEntry en curso
  lastStartedAt?: string | null;
  accumulatedSecToday?: number; // opcional: cache por UX rápida
  updatedAt: string;
}

// Eventos para logging o auditoría
export type TimerEvent =
  | {
      kind: "manual";
      trackableType: TrackableType;
      trackableId: string;
      lawyerId?: string;
      durationSec?: number | null;
      startedAt: string; // ISO (guardá en UTC)
      clientTs: string; // ISO UTC
    }
  | {
      kind: "start";
      trackableType: TrackableType;
      trackableId: string;
      lawyerId?: string;
      source?: "auto" | "manual";
      clientTs: string; // ISO UTC
    }
  | {
      kind: "pause";
      trackableType: TrackableType;
      trackableId: string;
      reason: PauseReason;
      clientTs: string; // ISO UTC
    };

export type Trackable = { type: TrackableType; id: string };
