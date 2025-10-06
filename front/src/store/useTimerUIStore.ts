// src/store/timer/useTimerUIStore.ts
import { create } from "zustand";
import type { Trackable, TimerStatus } from "@/types/Timer";

type MirrorState = {
  enabled: boolean;
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
      // s viene parcial; mergeamos con lo anterior
      set((prev) => ({ ...prev, ...s }));
    });

    set({ __bound: true, __off: off });
  },
}));
