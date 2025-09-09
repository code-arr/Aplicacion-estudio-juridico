// electron/store/timeBufferStore.ts
import store from "./electronStorage.js";

export type HeartbeatEntry = {
  docId: string;
  versionId?: string;
  deltaSec: number;
  clientTs: string;
};

const KEY = "timeBuffer.pending";

function readAll(): HeartbeatEntry[] {
  const v = store.get(KEY);
  return Array.isArray(v) ? (v as HeartbeatEntry[]) : [];
}
function writeAll(entries: HeartbeatEntry[]) {
  store.set(KEY, entries);
}

export const timeBufferStore = {
  append(entry: HeartbeatEntry) {
    writeAll([...readAll(), entry]);
  },
  appendMany(entries: HeartbeatEntry[]) {
    writeAll([...readAll(), ...entries]);
  },
  getPending(): HeartbeatEntry[] {
    return readAll();
  },
  setPending(entries: HeartbeatEntry[]) {
    writeAll(entries);
  },
  clear() {
    writeAll([]);
  },
  count(): number {
    return readAll().length;
  },
};
