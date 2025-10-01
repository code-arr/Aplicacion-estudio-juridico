// electron/presenceBridge.ts
import { app, BrowserWindow, powerMonitor } from "electron";

const CHANNEL = "presence:event";

export type PresenceEvent =
  | "app:suspend"
  | "app:resume"
  | "app:lock"
  | "app:unlock"
  | "app:shutdown"
  | "app:minimized-all" // ⬅️ nuevos
  | "app:restored-any"; // ⬅️ nuevos

function broadcast(ev: PresenceEvent) {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(CHANNEL, ev);
  });
}

// Power / OS
export function registerPresenceIpc() {
  powerMonitor.on("suspend", () => broadcast("app:suspend"));
  powerMonitor.on("resume", () => broadcast("app:resume"));
  powerMonitor.on("lock-screen", () => broadcast("app:lock"));
  powerMonitor.on("unlock-screen", () => broadcast("app:unlock"));
  app.on("before-quit", () => broadcast("app:shutdown"));
}

// Ventanas: llamá esto por CADA BrowserWindow creada
export function registerWindowVisibility(win: BrowserWindow) {
  const update = () => {
    const anyVisible = BrowserWindow.getAllWindows().some((w) =>
      isVisibleNotMinimized(w)
    );
    broadcast(anyVisible ? "app:restored-any" : "app:minimized-all");
  };
  win.on("minimize", update);
  win.on("restore", update);
  win.on("show", update);
  win.on("hide", update);
  win.on("close", () => setImmediate(update));
  setImmediate(update);
}

function isVisibleNotMinimized(w: BrowserWindow): boolean {
  try {
    return w.isVisible() && !w.isMinimized();
  } catch {
    return false;
  }
}
