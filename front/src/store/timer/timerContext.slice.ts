import type { StateCreator } from "zustand";
import {
  MIN_SEGMENT_SEC,
  type PauseReason,
  type TimeEntry,
  type TimerStatus,
  type Trackable,
} from "@/types/Timer";
import { clock } from "@/services/clock";
import { v4 as uuid } from "uuid";

export type TimerContextState = {
  active: Trackable | null;
  status: TimerStatus;

  startedAtUTC?: string; // para backend
  startedMonotonic?: number; // performance.now()
  lastActivityAt: number; // Date.now()
  lastPauseReason?: PauseReason;
};

export type TimerContextActions = {
  start: (trackable: Trackable, source?: "auto" | "switch") => void;
  pause: (reason: PauseReason, effectiveEndMs?: number) => void; // genera TimeEntry si corresponde
  switchTo: (trackable: Trackable | null) => void; // pausa (switch) y arranca nuevo o LawyerApp
  markActivity: () => void;
};

export type TimerContextSlice = TimerContextState & TimerContextActions;

type Deps = {
  onPaused?: (entry: TimeEntry) => void; // encolado local
  getLawyerId: () => string;
  getAppVersion?: () => string | undefined;
  getLawyerAppTrackable: () => Trackable; // fallback
};

export const createTimerContextSlice =
  (deps: Deps): StateCreator<TimerContextSlice, [], [], TimerContextSlice> =>
  (set, get) => ({
    active: null,
    status: "stopped",
    startedAtUTC: undefined,
    startedMonotonic: undefined,
    lastActivityAt: Date.now(),
    lastPauseReason: undefined,

    start: (trackable, _source) => {
      console.log("[TIMER] start", { trackable, _source });
      const { active, status } = get();

      // Si hay otro distinto corriendo, pausá por "switch"
      if (
        active &&
        status === "running" &&
        (active.id !== trackable.id || active.type !== trackable.type)
      ) {
        get().pause("switch");
      }

      const nowSys = clock.nowSystem();
      const nowMono = clock.nowMono();

      set({
        active: trackable,
        status: "running",
        startedAtUTC: clock.toUTCISOString(nowSys),
        startedMonotonic: nowMono,
        lastActivityAt: nowSys,
        lastPauseReason: undefined,
      });
    },

    pause: (reason, effectiveEndMs) => {
      console.log("[TIMER] pause()", { reason, effectiveEndMs });
      const { active, status, startedAtUTC } = get();

      if (!active || status !== "running" || !startedAtUTC) {
        // Nada que pausar
        set({
          status: reason === "close" ? "stopped" : "paused",
          lastPauseReason: reason,
        });
        return;
      }

      // ⬇️ Usamos fin “exacto” si viene (retroactivo a lastActivityAt + IDLE_LIMIT_MS)
      const endSysMs = effectiveEndMs ?? clock.nowSystem();
      const startedSysMs = Date.parse(startedAtUTC);

      // Duración por wall-clock (evita overshoot de timers throttled)
      const durationSec = Math.max(
        0,
        Math.round((endSysMs - startedSysMs) / 1000)
      );

      // Actualizar estado local
      set({
        status: reason === "close" ? "stopped" : "paused",
        startedAtUTC: undefined,
        startedMonotonic: undefined,
        lastPauseReason: reason,
      });

      // Descartar tramos muy cortos
      if (durationSec < MIN_SEGMENT_SEC) return;

      // Emitir TimeEntry con el end “real” (endSysMs)
      const entry: TimeEntry = {
        id: uuid(),
        trackableType: active.type,
        trackableId: active.id,
        lawyerId: deps.getLawyerId(),
        startedAtUTC,
        endedAtUTC: clock.toUTCISOString(endSysMs),
        durationSec,
        pauseReason: reason,
        appVersion: deps.getAppVersion?.(),
      };

      console.log("[TIMER] timeEntry", entry);
      deps.onPaused?.(entry);

      if (reason === "close") {
        set({ active: null });
      }
    },

    switchTo: (trackableOrNull) => {
      const { active, status } = get();

      const target = trackableOrNull ?? deps.getLawyerAppTrackable();

      // 👇 si el destino es igual al actual, no hagas nada
      if (
        active &&
        status === "running" &&
        active.type === target.type &&
        active.id === target.id
      ) {
        return;
      }

      // Pausar lo que esté corriendo
      if (active && status === "running") {
        get().pause("switch");
      }

      // Si no hay contexto ⇒ LawyerApp
      get().start(target, "switch");
    },

    markActivity: () => {
      set({ lastActivityAt: clock.nowSystem() });
    },
  });
