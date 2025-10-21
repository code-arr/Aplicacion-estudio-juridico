// ===== Trackable / tipos de EntryDay =====
export type TrackableType =
  | "Document"
  | "Meeting"
  | "Audience"
  | "Client"
  | "Process";

// ===== Entidad base que devuelve el back =====
export interface EntryDay {
  id: string;
  day: string; // "YYYY-MM-DD" (DATE, sin hora)
  durationSec: number;
  trackableId: string;
  lawyerId: string;
  clientId: string;
  type: TrackableType;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// ====== Respuestas de endpoints de estadísticas ======

// GET /entry-day/getTop10ByLawyerId?lawyerId=...
export interface TopClientRaw {
  clientId: string;
  firstName: string; // "Desconocido" si no hay dato
  totalTime: number; // segundos en el mes actual
}

// GET /entry-day/getClientDetail/:clientId?lawyerId=...
export interface ClientDetailRaw {
  clientId: string;
  clientName: string; // "Nombre Apellido" o "Desconocido"
  email: string | null;

  // Mapas de acumulados (en segundos)
  totalByDay: Record<string, number>; // "YYYY-MM-DD" -> sec
  totalByWeek: Record<number, number>; // weekNumber -> sec
  totalByMonth: Record<number, number>; // 1..12 -> sec
  totalByYear: number; // sec
  totalByMonthByType: Record<number, Partial<Record<TrackableType, number>>>; // mes -> tipo -> sec
}

// GET /entry-day/getMonthlyTimeByLawyerId?lawyerId=...
export type MonthlyTimeByLawyerRaw = Record<number, number>; // 1..12 -> sec
