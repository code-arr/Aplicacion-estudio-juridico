// electron/store/timeBufferStore.ts
import store from "./electronStorage.js";

export type TrackableType =
  | "Lawyer"
  | "Client"
  | "ClientItem"
  | "Document"
  | "Audience"
  | "Meeting"
  | "Process";
export type PauseReason = "idle" | "switch" | "close" | "manual";

export type TimerEvent =
  | {
      kind: "start";
      trackableType: TrackableType;
      trackableId: string;
      lawyerId?: string;
      source?: "auto" | "manual";
      clientTs: string;
    }
  | {
      kind: "pause";
      trackableType: TrackableType;
      trackableId: string;
      reason: PauseReason;
      clientTs: string;
    };

const KEY = "timeBuffer.pending.events";

function readAll(): TimerEvent[] {
  const v = store.get(KEY);
  return Array.isArray(v) ? (v as TimerEvent[]) : [];
}
function writeAll(events: TimerEvent[]) {
  store.set(KEY, events);
}

export const timeBufferStore = {
  append(ev: TimerEvent) {
    writeAll([...readAll(), ev]);
  },
  appendMany(events: TimerEvent[]) {
    writeAll([...readAll(), ...events]);
  },
  getPending(): TimerEvent[] {
    return readAll();
  },
  setPending(events: TimerEvent[]) {
    writeAll(events);
  },
  clear() {
    writeAll([]);
  },
  count(): number {
    return readAll().length;
  },
};
