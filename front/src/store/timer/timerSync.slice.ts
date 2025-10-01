import type { StateCreator } from "zustand";
import type { TimeEntry } from "@/types/Timer";

export type TimerSyncState = {
  pending: TimeEntry[]; // cola FIFO
  retryBackoffMs?: number; // backoff exponencial actual
  lastFlushAt?: number; // Date.now()
};

export type TimerSyncActions = {
  enqueue: (entry: TimeEntry) => void;
  dequeueMany: (n: number) => TimeEntry[];
  peekBatch: (n: number) => TimeEntry[];
  setBackoff: (ms?: number) => void;
  markFlushed: () => void;
  size: () => number;
};

export type TimerSyncSlice = TimerSyncState & TimerSyncActions;

export const createTimerSyncSlice: StateCreator<
  TimerSyncSlice,
  [],
  [],
  TimerSyncSlice
> = (set, get) => ({
  pending: [],
  retryBackoffMs: undefined,
  lastFlushAt: undefined,

  enqueue: (entry) => set((s) => ({ pending: [...s.pending, entry] })),
  dequeueMany: (n) => {
    const { pending } = get();
    const take = Math.max(0, Math.min(n, pending.length));
    const batch = pending.slice(0, take);
    set({ pending: pending.slice(take) });
    return batch;
  },
  peekBatch: (n) =>
    get().pending.slice(0, Math.max(0, Math.min(n, get().pending.length))),
  setBackoff: (ms) => set({ retryBackoffMs: ms }),
  markFlushed: () =>
    set({ lastFlushAt: Date.now(), retryBackoffMs: undefined }),
  size: () => get().pending.length,
});
