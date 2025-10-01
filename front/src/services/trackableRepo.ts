// src/services/trackableRepo.ts
import type { TimeEntry } from "@/types/Timer";

const electronQ =
  typeof window !== "undefined" && window.electronAPI?.timeQueue
    ? window.electronAPI.timeQueue
    : undefined;

// Fallback en memoria si no hay Electron (útil para dev web / tests)
let _pendingMem: TimeEntry[] = [];

export interface TrackableRepo {
  loadPending(): Promise<TimeEntry[]>;
  savePending(list: TimeEntry[]): Promise<void>;
  appendPending(entry: TimeEntry): Promise<void>;
}

export function createTrackableRepo(): TrackableRepo {
  if (electronQ) {
    return {
      async loadPending() {
        return electronQ.getPending();
      },
      async savePending(list) {
        await electronQ.setPending(list);
      },
      async appendPending(entry) {
        await electronQ.appendEntry(entry);
      },
    };
  }

  // Web fallback
  return {
    async loadPending() {
      return [..._pendingMem];
    },
    async savePending(list) {
      _pendingMem = [...list];
    },
    async appendPending(entry) {
      _pendingMem.push(entry);
    },
  };
}
