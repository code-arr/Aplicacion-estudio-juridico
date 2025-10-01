import type { TimeEntry } from "@/types/Timer";
import type { TimerStore } from "@/store/timer/useTimerStore";

export type SyncApi = {
  // Debe ser idempotente por entry.id (upsert)
  sendBatch: (entries: TimeEntry[]) => Promise<void>;
};

export type SyncService = {
  flushNow: (maxBatch?: number) => Promise<void>;
  scheduleAutoFlush: () => void;
  stopAutoFlush: () => void;
  onOnline: () => void;
  onAuthOk: () => void;
};

export function createSyncService(deps: {
  store: {
    getState: () => TimerStore;
    setState?: (p: Partial<TimerStore>) => void;
  };
  api: SyncApi;
  minIntervalMs?: number; // 1000
  maxBackoffMs?: number; // 300_000
  batchSize?: number; // 20
}): SyncService {
  const minInterval = deps.minIntervalMs ?? 1000;
  const maxBackoff = deps.maxBackoffMs ?? 300_000;
  const batchSize = deps.batchSize ?? 20;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  async function flushNow(maxBatch = batchSize) {
    if (running) return;
    const s = deps.store.getState();
    const batch = s.peekBatch(maxBatch);
    if (batch.length === 0) return;

    running = true;
    try {
      await deps.api.sendBatch(batch);
      // Si OK, de-queue
      s.dequeueMany(batch.length);
      s.markFlushed();
      // reset backoff
      s.setBackoff(undefined);
    } catch (err) {
      // aumentar backoff
      const prev = s.retryBackoffMs ?? minInterval;
      const next = Math.min(prev * 2, maxBackoff);
      s.setBackoff(next);
    } finally {
      running = false;
      scheduleAutoFlush();
    }
  }

  function scheduleAutoFlush() {
    const s = deps.store.getState();
    const backoff = s.retryBackoffMs ?? minInterval;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flushNow(batchSize), backoff);
  }

  function stopAutoFlush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function onHint() {
    // hint de conectividad o auth → intentar flush inmediato
    void flushNow(batchSize);
  }

  return {
    flushNow,
    scheduleAutoFlush,
    stopAutoFlush,
    onOnline: onHint,
    onAuthOk: onHint,
  };
}
