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

function isAppWindow(w: BrowserWindow): boolean {
  try {
    const url = w.webContents.getURL();
    if (url.startsWith("devtools://")) return false; // 👈 ignora DevTools
    return true;
  } catch {
    return false;
  }
}

function anyAppWindowVisible(): boolean {
  return BrowserWindow.getAllWindows().some((w) => {
    if (!isAppWindow(w)) return false;
    try {
      return w.isVisible() && !w.isMinimized();
    } catch {
      return false;
    }
  });
}

// Ventanas: llamá esto por CADA BrowserWindow creada
export function registerWindowVisibility(win: BrowserWindow) {
  const update = () => {
    const anyVisible = anyAppWindowVisible();
    broadcast(anyVisible ? "app:restored-any" : "app:minimized-all");
  };
  win.on("minimize", update);
  win.on("restore", update);
  win.on("show", update);
  win.on("hide", update);
  win.on("close", () => setImmediate(update));
  setImmediate(update);
}

/* function isVisibleNotMinimized(w: BrowserWindow): boolean {
  try {
    return w.isVisible() && !w.isMinimized();
  } catch {
    return false;
  }
} */
