// electron/sync/syncService.ts

import { timeQueueStore, timeQueueEvents } from "../store/timeQueueStore.js";
import type { SyncApi } from "./syncApi.js";

export type MainSyncService = {
  flushNow: (maxBatch?: number) => Promise<void>;
  scheduleAutoFlush: () => void;
  stopAutoFlush: () => void;
  onOnline: () => void;
  onAuthOk: () => void;
  getStatus: () => { pending: number; backoffMs?: number };
};

export function createMainSyncService(deps: {
  api: SyncApi;
  minIntervalMs?: number; // 1000
  maxBackoffMs?: number; // 300_000
  batchSize?: number; // 20
}): MainSyncService {
  const minInterval = deps.minIntervalMs ?? 1000;
  const maxBackoff = deps.maxBackoffMs ?? 300_000;
  const batchSize = deps.batchSize ?? 20;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let backoffMs: number | undefined = undefined;

  async function flushNow(maxBatch = batchSize) {
    if (running) return;
    const pending = timeQueueStore.getPending();
    if (pending.length === 0) return;

    const batch = pending.slice(0, maxBatch);
    running = true;
    try {
      await deps.api.sendBatch(batch);
      // OK → dequeue
      const rest = pending.slice(batch.length);
      timeQueueStore.setPending(rest);
      backoffMs = undefined; // reset
    } catch (err) {
      const prev = backoffMs ?? minInterval;
      backoffMs = Math.min(prev * 2, maxBackoff);
    } finally {
      running = false;
      scheduleAutoFlush();
    }
  }

  function scheduleAutoFlush() {
    const delay = backoffMs ?? minInterval;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flushNow(batchSize), delay);
  }

  function stopAutoFlush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function onHint() {
    // pista de conectividad o auth → intentá un flush ya
    void flushNow(batchSize);
  }

  // Escuchá cambios de cola para “despertar”
  timeQueueEvents.on("changed", () => {
    // si alguien encoló, probá pronto
    scheduleAutoFlush();
  });

  return {
    flushNow,
    scheduleAutoFlush,
    stopAutoFlush,
    onOnline: onHint,
    onAuthOk: onHint,
    getStatus: () => ({ pending: timeQueueStore.count(), backoffMs }),
  };
}
