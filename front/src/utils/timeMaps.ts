import type {
  ClientDetailRaw,
  MonthlyTimeByLawyerRaw,
  TrackableType,
} from "@/types/EntryDay";

// Tipos útiles para la UI
export type Point = { label: string; hours: number };
export type CategoryRow = { label: string; hours: number };

export type DayMode = "rolling7" | "isoWeek";
type MapDaysOptions = {
  mode?: DayMode; // "rolling7" (default) o "isoWeek"
  onlyWeekDays?: boolean; // si true, excluye sábados y domingos
};

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export const secToHours = (sec: number): number => {
  const h = sec / 3600;
  // redondeo amable para UI
  return Math.round(h * 10) / 10;
};

export const currentMonthNumber = (d = new Date()): number => d.getMonth() + 1; // 1..12

function startOfIsoWeek(d = new Date()): Date {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // lun=1 … dom=7
  date.setUTCDate(date.getUTCDate() - (day - 1)); // ir al lunes
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
function addDaysUTC(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function isoKey(d: Date) {
  // "YYYY-MM-DD" en UTC
  return d.toISOString().slice(0, 10);
}
function isWeekend(d: Date) {
  const wd = d.getUTCDay(); // 0=dom, 6=sáb
  return wd === 0 || wd === 6;
}
function dayShortEsCapital(d: Date) {
  // "Jue", "Lun", "Mié" (capitalizar y sin punto)
  const raw = d.toLocaleDateString("es-AR", {
    weekday: "short",
    timeZone: "UTC",
  });
  const clean = raw.replace(".", "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
function ddSlashMM(d: Date) {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

// =======================
// SERIES POR MES (abogado)
// =======================
export function mapMonthlyToSeries(
  map: MonthlyTimeByLawyerRaw,
  takeLast = 12
): Point[] {
  if (!map) return [];
  const months = Object.keys(map)
    .map((k) => Number(k))
    .filter((m) => m >= 1 && m <= 12)
    .sort((a, b) => a - b);

  const sliced = months.slice(-takeLast);
  return sliced.map((m) => ({
    label: MONTH_LABELS[m - 1],
    hours: secToHours(map[m] || 0),
  }));
}

// =======================
// SERIES POR DÍA (cliente)
// =======================
/**
 * Mapea el objeto { "YYYY-MM-DD": segundos } a una serie para el gráfico de “Días”.
 * - mode="rolling7": últimos 7 días corridos (default)
 * - mode="isoWeek": semana ISO actual (lunes→domingo)
 * - onlyWeekDays=true: excluye sábados y domingos en ambos modos
 */
export function mapDaysToSeries(
  totalByDay: Record<string, number>,
  opts: MapDaysOptions = {}
): { label: string; hours: number }[] {
  const { mode = "rolling7", onlyWeekDays = false } = opts;

  const buildDates = (): Date[] => {
    if (mode === "isoWeek") {
      const start = startOfIsoWeek(new Date());
      const out: Date[] = [];
      for (let i = 0; i < 7; i++) out.push(addDaysUTC(start, i));
      return out;
    }
    // rolling7: hoy hacia atrás 6 días (orden cronológico)
    const today = new Date();
    const base = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );
    const out: Date[] = [];
    for (let i = 6; i >= 0; i--) out.push(addDaysUTC(base, -i));
    return out;
  };

  let days = buildDates();
  if (onlyWeekDays) days = days.filter((d) => !isWeekend(d));

  return days.map((d) => {
    const key = isoKey(d); // "YYYY-MM-DD"
    const sec = totalByDay[key] ?? 0;
    const hours = sec / 3600;
    // etiqueta solicitada: "Jue 16/10"
    const label = `${dayShortEsCapital(d)} ${ddSlashMM(d)}`;
    return { label, hours };
  });
}

// =======================
// SERIES POR SEMANA (cliente)
// =======================
export function mapWeeksToSeries(
  totalByWeek: Record<number, number>,
  takeLast = 7
): Point[] {
  if (!totalByWeek) return [];
  const weeks = Object.keys(totalByWeek)
    .map(Number)
    .sort((a, b) => a - b); // asc

  const sliced = weeks.slice(-takeLast);
  return sliced.map((w) => ({
    label: `Sem ${w}`,
    hours: secToHours(totalByWeek[w] || 0),
  }));
}

// ============================================
// CATEGORÍAS POR TIPO PARA EL MES (cliente)
// Usa totalByMonthByType[mesActual] del back
// ============================================
export function categoriesFromMonthByType(
  totalByMonthByType: ClientDetailRaw["totalByMonthByType"],
  month?: number
): CategoryRow[] {
  if (!totalByMonthByType) return [];
  const m = month ?? currentMonthNumber();
  const entry = totalByMonthByType[m];
  if (!entry) return [];

  const labelsOrder: TrackableType[] = [
    "Document",
    "Audience",
    "Meeting",
    "Process",
    "Client",
  ]; // podés cambiar el orden si querés
  const rows: CategoryRow[] = [];

  labelsOrder.forEach((t) => {
    const sec = entry[t] ?? 0;
    if (sec > 0) rows.push({ label: typeLabel(t), hours: secToHours(sec) });
  });

  // Si no hay nada > 0, retornamos con ceros para que la UI no quede vacía
  if (!rows.length) {
    return labelsOrder.map((t) => ({ label: typeLabel(t), hours: 0 }));
  }
  return rows;
}

// =======================
// Sumas útiles (opcional)
// =======================
export function sumMonth(map: Record<number, number>, month?: number): number {
  const m = month ?? currentMonthNumber();
  const sec = map?.[m] ?? 0;
  return secToHours(sec);
}

// =======================
// Helpers internos
// =======================
function typeLabel(t: TrackableType): string {
  switch (t) {
    case "Document":
      return "Documents";
    case "Audience":
      return "Audiences";
    case "Meeting":
      return "Meetings";
    case "Process":
      return "Processes";
    case "Client":
      return "Client";
    default:
      return t;
  }
}

function capitalizeShort(s: string): string {
  if (!s) return s;
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
