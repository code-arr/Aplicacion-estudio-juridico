import { getChileTz } from "@/utils/tz";

export type GlobalTimerSnapshot = {
  dayKey: string;
  accumSecToday: number;
  runningSince?: number | null;
};

// Día "YYYY-MM-DD" en TZ Chile (coherente con tu lógica actual)
export function makeDayKey(ms = Date.now(), tz = getChileTz()): string {
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
  }).format(ms);
  const m = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "2-digit",
  }).format(ms);
  const d = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    day: "2-digit",
  }).format(ms);
  return `${y}-${m}-${d}`;
}

const hasElectron = typeof window !== "undefined" && !!window.timerGlobal;

export async function loadSnapshot(): Promise<GlobalTimerSnapshot | null> {
  if (!hasElectron) return null;
  return await window.timerGlobal.getSnapshot();
}

export async function saveSnapshot(snap: GlobalTimerSnapshot): Promise<void> {
  if (!hasElectron) return;
  await window.timerGlobal.setSnapshot(snap);
}

export async function clearSnapshot(): Promise<void> {
  if (!hasElectron) return;
  await window.timerGlobal.clearSnapshot();
}
