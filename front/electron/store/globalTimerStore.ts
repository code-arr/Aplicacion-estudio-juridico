import store from "./electronStorage.js";

export type GlobalTimerSnapshot = {
  dayKey: string; // "YYYY-MM-DD" en la TZ de referencia
  accumSecToday: number; // segundos
  runningSince?: number | null; // epoch ms (opcional, diagnóstico)
};

const KEY = "timers.global.snapshot";

function read(): GlobalTimerSnapshot | null {
  const v = store.get(KEY);
  if (!v || typeof v !== "object") return null;
  const snap = v as any;
  if (typeof snap.dayKey !== "string") return null;
  if (typeof snap.accumSecToday !== "number") return null;
  return {
    dayKey: snap.dayKey,
    accumSecToday: snap.accumSecToday,
    runningSince:
      typeof snap.runningSince === "number" ? snap.runningSince : null,
  };
}

function write(snap: GlobalTimerSnapshot) {
  store.set(KEY, snap);
}

function clear() {
  store.delete(KEY);
}

export const globalTimerStore = { read, write, clear };
