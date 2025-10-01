import type { StateCreator } from "zustand";

export type TimerGlobalState = {
  enabled: boolean; // ⬅️ NUEVO
  status: "running" | "paused" | "stopped";
  runningSince?: number; // epoch ms
  accumSecToday: number; // acumulado del día (segundos)
};

export type TimerGlobalActions = {
  setEnabled: (v: boolean) => void; // ⬅️ NUEVO
  workStart: () => void;
  workPause: (
    reason: "idle" | "logout" | "close" | "suspend",
    effectiveEndMs?: number
  ) => void;
  workReset: () => void; // al cruzar medianoche
};

export type TimerGlobalSlice = TimerGlobalState & TimerGlobalActions;

export const createTimerGlobalSlice: StateCreator<
  TimerGlobalSlice,
  [],
  [],
  TimerGlobalSlice
> = (set, get) => ({
  enabled: false, // ⬅️ NUEVO
  status: "stopped",
  runningSince: undefined,
  accumSecToday: 0,

  setEnabled: (v) => set({ enabled: v }), // ⬅️ NUEVO

  workStart: () => {
    if (!get().enabled) return; // ⬅️ NUEVO (guarda)
    const { status, runningSince } = get();
    if (status === "running" && runningSince) return;
    console.log("[GLOBAL] workStart");
    set({ status: "running", runningSince: Date.now() });
  },

  workPause: (reason, effectiveEndMs) => {
    if (!get().enabled) return; // ⬅️ NUEVO (guarda)
    const { status, runningSince, accumSecToday } = get();
    if (status !== "running") return;
    console.log("[GLOBAL] workPause:", reason);

    const endMs = effectiveEndMs ?? Date.now();
    if (runningSince) {
      const deltaSec = Math.max(0, Math.floor((endMs - runningSince) / 1000));
      set({
        status: "paused",
        runningSince: undefined,
        accumSecToday: accumSecToday + deltaSec,
      });
    } else {
      set({ status: "paused" });
    }
  },

  workReset: () => {
    if (!get().enabled) return; // ⬅️ NUEVO (guarda)
    console.log("[GLOBAL] workReset");
    set({
      status: "stopped",
      runningSince: undefined,
      accumSecToday: 0,
    });
  },
});
