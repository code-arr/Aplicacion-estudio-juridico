// src/store/useTimerStore.ts
import { create } from "zustand";
import type { TimeEntry, Trackable } from "@/types/Timer";
import {
  createTimerGlobalSlice,
  type TimerGlobalSlice,
} from "./timerGlobal.slice";
import { createTimerSyncSlice, type TimerSyncSlice } from "./timerSync.slice";
import {
  createTimerContextSlice,
  type TimerContextSlice,
} from "./timerContext.slice";
import { createTrackableRepo } from "@/services/trackableRepo";
import { createSyncService } from "@/services/syncService";
import { createSyncApi } from "@/services/syncApi";
import { useLawyerStore } from "@/store/useLawyerStore";
import { getChileTz } from "@/utils/tz";
import {
  loadSnapshot,
  makeDayKey,
  saveSnapshot,
} from "@/services/globalTimerSnapshot";

function getLawyerId(): string {
  const lawyerId = useLawyerStore.getState().lawyer?.id ?? "UNKNOWN_LAWYER";
  return lawyerId; // TODO: tomar de tu auth store
}
function getAppVersion(): string | undefined {
  return undefined;
}
function getLawyerAppTrackable(): Trackable {
  return { type: "LawyerApp", id: getLawyerId() };
}

export type TimerStore = TimerGlobalSlice & TimerContextSlice & TimerSyncSlice;

export const useTimerStore = create<TimerStore>()((...a) => ({
  ...createTimerGlobalSlice(...a),
  ...createTimerSyncSlice(...a),
  ...createTimerContextSlice({
    getLawyerId,
    getAppVersion,
    getLawyerAppTrackable,
    onPaused: (entry: TimeEntry) => {
      // Encolar en memoria (slice) — persistencia real la hacemos desde init
      a[0]((s) => ({ pending: [...(s as TimerStore).pending, entry] }));
    },
  })(...a),
}));

// === Selectores utilitarios (dejá los que ya tenías) ===
export const selectWorkElapsedSec = (s: TimerStore): number => {
  const base = s.accumSecToday;
  if (s.status === "running" && s.runningSince) {
    const delta = Math.max(0, Math.floor((Date.now() - s.runningSince) / 1000));
    return base + delta;
  }
  return base;
};

export const selectIsContextRunning = (s: TimerStore) =>
  s.contextStatus === "running" && !!s.active && !!s.startedAtUTC;

export const selectActiveContext = (s: TimerStore) => s.active;

// === Inicialización de persistencia y sync ===
const repo = createTrackableRepo();
const api = createSyncApi("/api"); // ajustá baseUrl si corresponde
const sync = createSyncService({
  store: { getState: useTimerStore.getState },
  api,
  minIntervalMs: 1000,
  maxBackoffMs: 300_000,
  batchSize: 20,
});

/**
 * Cargar pendientes desde electron-store al boot, sincronizar estado
 * en memoria y arrancar el loop de sync + hints (online/auth).
 */
export async function initTimerPersistenceAndSync() {
  // ⬇️ NUEVO: restaurar snapshot del global
  try {
    const tz = getChileTz();
    const todayKey = makeDayKey(Date.now(), tz);
    const snap = await loadSnapshot();
    if (snap && snap.dayKey === todayKey) {
      useTimerStore.setState({
        accumSecToday: snap.accumSecToday,
        runningSince: undefined, // no reanudamos solos
        status: "paused", // queda pausado hasta que el Dashboard lo prenda
      });
    } else {
      useTimerStore.setState({
        accumSecToday: 0,
        runningSince: undefined,
        status: "stopped",
      });
    }
  } catch (e) {
    console.warn("[TIMER] snapshot restore failed:", e);
  }

  // 1) Cargar cola persistida (si existía)
  const persisted = await repo.loadPending();
  useTimerStore.setState(() => ({ pending: persisted }));

  // ⬇️ NUEVO: persistir snapshot cuando cambie el global
  {
    let saveTimer: number | null = null;
    let last = {
      dayKey: "",
      accum: -1,
      running: undefined as number | undefined,
    };

    useTimerStore.subscribe((s) => {
      const tz = getChileTz();
      const dayKey = makeDayKey(Date.now(), tz);

      const accum = s.accumSecToday;
      const running = s.runningSince;

      const changed =
        dayKey !== last.dayKey ||
        accum !== last.accum ||
        running !== last.running;

      if (!changed) return;
      last = { dayKey, accum, running };

      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        void saveSnapshot({
          dayKey,
          accumSecToday: accum,
          runningSince: running ?? null,
        });
      }, 500); // throttle simple
    });
  }

  // 2) Encolar en persistencia real cuando la store agrega items
  //    (parche simple: watcher de cambios dif — también podés
  //     envolver actions enqueue/dequeueMany para persistir ahí).
  let lastLen = persisted.length;
  useTimerStore.subscribe(async (s) => {
    console.log("[STORE] status:", {
      global: s.status,
      active: s.active,
      pending: s.pending.length,
    });
    if (s.pending.length !== lastLen) {
      lastLen = s.pending.length;
      await repo.savePending(s.pending);
    }
  });

  // 3) Arrancar sync automático
  sync.scheduleAutoFlush();

  // 4) Hints: online/auth → intentar flush inmediato
  window.addEventListener("online", () => sync.onOnline());
  // si tenés un evento de "auth ok", llamá sync.onAuthOk()
}

export { sync };
