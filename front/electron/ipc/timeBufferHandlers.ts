// electron/ipc/timeBufferHandlers.ts
import { ipcMain } from "electron";
import { timeBufferStore, type TimerEvent } from "../store/timeBufferStore.js";

export function registerTimeBufferHandlers() {
  ipcMain.handle("timeBuffer:append", (_e, ev: TimerEvent) => {
    timeBufferStore.append(ev);
    return timeBufferStore.count();
  });

  ipcMain.handle("timeBuffer:getPending", () => {
    return timeBufferStore.getPending();
  });

  ipcMain.handle("timeBuffer:setPending", (_e, events: TimerEvent[]) => {
    timeBufferStore.setPending(events);
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
