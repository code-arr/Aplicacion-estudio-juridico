// electron/ipc/timeQueueHandlers.ts
import { ipcMain } from "electron";
import { timeQueueStore } from "../store/timeQueueStore.js";
import type { TimeEntry } from "../../src/types/Timer.js";

export function registerTimeQueueHandlers() {
  ipcMain.handle("timeQueue:appendEntry", (_e, entry: TimeEntry) => {
    timeQueueStore.append(entry);
    return timeQueueStore.count();
  });

  ipcMain.handle("timeQueue:getPending", () => {
    return timeQueueStore.getPending();
  });

  ipcMain.handle("timeQueue:setPending", (_e, entries: TimeEntry[]) => {
    timeQueueStore.setPending(entries);
    return timeQueueStore.count();
  });

  ipcMain.handle("timeQueue:clear", () => {
    timeQueueStore.clear();
    return 0;
  });

  ipcMain.handle("timeQueue:count", () => {
    return timeQueueStore.count();
  });
}
