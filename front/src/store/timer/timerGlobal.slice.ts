import type { StateCreator } from "zustand";

export type TimerGlobalState = {
  status: "running" | "paused" | "stopped";
  runningSince?: number; // epoch ms
  accumSecToday: number; // acumulado del día (segundos)
};

export type TimerGlobalActions = {
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
  status: "stopped",
  runningSince: undefined,
  accumSecToday: 0,

  workStart: () => {
    const { status, runningSince } = get();
    if (status === "running" && runningSince) return;
    console.log("[GLOBAL] workStart");
    console.log("Segundos: " + get().accumSecToday);

    set({ status: "running", runningSince: Date.now() });
  },

  workPause: (reason, effectiveEndMs) => {
    const { status, runningSince, accumSecToday } = get();
    if (status !== "running") return;
    console.log("[GLOBAL] workPause");

    const endMs = effectiveEndMs ?? Date.now(); // 👈 usa el fin “exacto” si viene

    if (runningSince) {
      const deltaSec = Math.max(0, Math.floor((endMs - runningSince) / 1000));
      set({
        status: "paused",
        runningSince: undefined,
        accumSecToday: accumSecToday + deltaSec,
      });
      console.log("Segundos: " + get().accumSecToday);
    } else {
      set({ status: "paused" });
    }
  },

  workReset: () => {
    console.log("[GLOBAL] workReset");
    set({
      status: "stopped",
      runningSince: undefined,
      accumSecToday: 0,
    });
  },
});
