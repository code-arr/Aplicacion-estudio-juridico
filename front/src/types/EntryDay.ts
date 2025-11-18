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

export type Currency = "CLP" | "USD" | "UF";

export interface CostSummary {
  scope: {
    year: number;
    month: number | null;
    lawyerId: string;
    clientId: string;
    clientItemId: string | null;
  };
  time: {
    totalSec: number;
    totalHours: number;
  };
  pricing: {
    hourlyRate: number;
    currency: Currency;
  };
  // totalCost puede seguir existiendo como shortcut (legacy)
  totalCost?: number;

  // breakdowns y formatos: opcionales porque no siempre vienen
  costsByCurrency?: Record<string, number>; // { CLP: 1234.5, USD: 45.6 }
  mixedCurrency?: boolean;

  // formatted para UI (strings listos para mostrar)
  formatted?: {
    hourlyRate?: string; // p.e. "$1.000"
    totalCost?: string; // p.e. "USD 1,600"
    // nuevo: map con cada moneda formateada
    costsByCurrencyFormatted?: Record<string, string>; // { CLP: '$1.000', USD: 'USD 1,600' }
  };
}

export interface CaseCycleRes {
  clientItemId: string;
  title: string;
  status: "open" | "on_hold" | "closed";
  createdAt: string;
  closedAt: string | null;
  daysToClose: number | null;
  daysOpen: number | null;
  worked: { totalSec: number; totalHours: number };
}

export interface CaseCostRes {
  clientItemId: string;
  time: { totalHours: number };
  pricing: { hourlyRate: number; currency: Currency | null };
  cost: { raw: number; currency: Currency | null };
}

export interface ClientAveragesRes {
  clientId: string;
  cases: { total: number; open: number; closed: number };
  hours: { total: number; avgPerCase: number };
  cost: { currency: Currency | null; avgPerCase: number };
  timeToClose: { avgDays: number };
  pricing: { hourlyRate: number; currency: Currency | null };
}

export interface StudyAveragesRes {
  scope: "studio" | "lawyer";
  year: number | null;
  totals: {
    clients: number;
    cases: number;
    hours: number;
    cost: { raw: number; currency: Currency | null };
  };
  averages: {
    costPerClient: { raw: number; currency: Currency | null };
    costPerCase: { raw: number; currency: Currency | null };
    // 👇 NUEVO: promedio de resolución en días
    resolutionDaysAvg: number | null;
  };
}

export interface PracticeAreasItem {
  name: string;
  cases: number;
  hours?: number;
  cost?: { raw: number; currency: Currency | null };
  avgCostPerCase?: number;
}
export interface PracticeAreasRes {
  clientId: string;
  level: "category" | "section" | "itemType";
  items: PracticeAreasItem[];
}

/* export interface CostSummaryRes {
  scope: {
    year: number;
    month: number | null;
    lawyerId: string;
    clientId: string;
    clientItemId: string | null;
  };
  time: { totalSec: number; totalHours: number };
  pricing: { hourlyRate: number; currency: Currency };
  totalCost: number;
  formatted: { hourlyRate: string; totalCost: string };
} */

export interface CostSummaryRes extends CostSummary {}

// GET /entry-day/getMonthlyTimeByLawyerId?lawyerId=...
export type MonthlyTimeByLawyerRaw = Record<number, number>; // 1..12 -> sec
