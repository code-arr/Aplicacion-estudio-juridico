// src/store/timer/useTimerUIStore.ts
import { create } from "zustand";
import type { Trackable, TimerStatus } from "@/types/Timer";

type MirrorState = {
  enabled: boolean;
  ready: boolean;
  status: Extract<TimerStatus, "running" | "stopped">; // global
  runningSince?: number | null; // epoch ms
  accumSecToday: number;

  active: Trackable | null; // contexto
  contextStatus: TimerStatus; // "running" | "paused" | "stopped"
  lastActivityAt: number;
};

type MirrorStore = MirrorState & {
  __bound: boolean; // para no suscribir dos veces
  __off?: () => void; // para guardar el unsubscribe
  bindToMain: () => Promise<void>;
};

export const useTimerUIStore = create<MirrorStore>((set, get) => ({
  enabled: false,
  ready: false,
  status: "stopped",
  runningSince: null,
  accumSecToday: 0,
  active: null,
  contextStatus: "stopped",
  lastActivityAt: Date.now(),
  __bound: false,
  __off: undefined,

  async bindToMain() {
    const st = get();
    if (st.__bound) return;

    // Fallback web: no hace nada si no estamos en Electron
    if (!("timer" in window) || typeof window.timer?.subscribe !== "function") {
      set({ __bound: true });
      return;
    }

    const off = await window.timer.subscribe((s: Partial<MirrorState>) => {
      set((prev) => {
        // 🟢 RESET REAL solo si ambos estados son READY
        if (
          prev.ready &&
          s.ready &&
          typeof s.accumSecToday === "number" &&
          prev.accumSecToday > s.accumSecToday
        ) {
          console.warn(
            "%c[TIMER RESET DETECTED]",
            "color:#ef4444;font-weight:bold",
            {
              from: prev.accumSecToday,
              to: s.accumSecToday,
            }
          );
        }

        return { ...prev, ...s };
      });
    });

    set({ __bound: true, __off: off });
  },
}));
