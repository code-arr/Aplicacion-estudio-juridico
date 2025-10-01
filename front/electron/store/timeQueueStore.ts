// electron/store/timeQueueStore.ts
import store from "./electronStorage.js";
import type { TimeEntry } from "../../src/types/Timer.js";

const KEY = "timers.pending.entries";

function readAll(): TimeEntry[] {
  const v = store.get(KEY);
  return Array.isArray(v) ? (v as TimeEntry[]) : [];
}
function writeAll(entries: TimeEntry[]) {
  store.set(KEY, entries);
}

export const timeQueueStore = {
  append(entry: TimeEntry) {
    writeAll([...readAll(), entry]);
  },
  setPending(entries: TimeEntry[]) {
    writeAll(entries);
  },
  getPending(): TimeEntry[] {
    return readAll();
  },
  clear() {
    writeAll([]);
  },
  count(): number {
    return readAll().length;
  },
};
