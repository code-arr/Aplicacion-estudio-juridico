// electron/store/globalTimerStore.ts
import store from "./electronStorage.js";

export type GlobalTimerSnapshot = {
  dayKey: string; // "YYYY-MM-DD" en la TZ de referencia
  accumSecToday: number; // segundos
  runningSince?: number | null; // epoch ms (opcional, diagnóstico)
};

const getKey = (lawyerId: string) => `timers.global.${lawyerId}`;

// 💡 Pedimos lawyerId en el read
function read(lawyerId: string): GlobalTimerSnapshot | null {
  if (!lawyerId) return null; // Seguridad
  const v = store.get(getKey(lawyerId));
  if (!v || typeof v !== "object") return null;

  const snap = v as any;
  // ... validaciones iguales que tenías ...
  if (typeof snap.dayKey !== "string") return null;
  if (typeof snap.accumSecToday !== "number") return null;

  return {
    dayKey: snap.dayKey,
    accumSecToday: snap.accumSecToday,
    runningSince:
      typeof snap.runningSince === "number" ? snap.runningSince : null,
  };
}

// 💡 Pedimos lawyerId en el write
function write(lawyerId: string, snap: GlobalTimerSnapshot) {
  if (!lawyerId) return;
  store.set(getKey(lawyerId), snap);
}

// (Opcional) Podés borrar la clave específica si querés
function clear(lawyerId: string) {
  if (lawyerId) store.delete(getKey(lawyerId));
}

export const globalTimerStore = { read, write, clear };
