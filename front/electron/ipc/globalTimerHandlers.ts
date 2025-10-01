import { ipcMain } from "electron";
import { globalTimerStore } from "../store/globalTimerStore.js";
import type { GlobalTimerSnapshot } from "../store/globalTimerStore.js";

export function registerGlobalTimerHandlers() {
  ipcMain.handle("globalTimer:getSnapshot", () => {
    return globalTimerStore.read();
  });

  ipcMain.handle("globalTimer:setSnapshot", (_e, snap: GlobalTimerSnapshot) => {
    globalTimerStore.write(snap);
    return true;
  });

  ipcMain.handle("globalTimer:clearSnapshot", () => {
    globalTimerStore.clear();
    return true;
  });
}
