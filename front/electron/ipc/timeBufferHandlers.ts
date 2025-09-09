// electron/ipc/timeBufferHandlers.ts
import { ipcMain } from "electron";
import {
  timeBufferStore,
  type HeartbeatEntry,
} from "../store/timeBufferStore.js";

export function registerTimeBufferHandlers() {
  ipcMain.handle("timeBuffer:append", (_e, entry: HeartbeatEntry) => {
    timeBufferStore.append(entry);
    return timeBufferStore.count();
  });

  ipcMain.handle("timeBuffer:getPending", () => {
    return timeBufferStore.getPending();
  });

  ipcMain.handle("timeBuffer:setPending", (_e, entries: HeartbeatEntry[]) => {
    timeBufferStore.setPending(entries);
    return timeBufferStore.count();
  });

  ipcMain.handle("timeBuffer:clear", () => {
    timeBufferStore.clear();
    return 0;
  });

  ipcMain.handle("timeBuffer:count", () => {
    return timeBufferStore.count();
  });
}
