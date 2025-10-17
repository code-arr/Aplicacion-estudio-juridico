// electron/preload.ts
import { contextBridge, ipcRenderer, shell } from "electron";
import type { TimeEntry } from "../src/types/Timer";

/**
 * Expone funciones seguras al frontend a través de window.electronAPI
 *
 * ✅ Estamos listos para:
 * - Enviar eventos (send)
 * - Escuchar eventos (on)
 * - Pedir algo y recibir una respuesta (invoke)
 * - Usar el buffer local de tiempo (timeBuffer.*) SIN tocar la red desde Electron
 */

// ⬇️ NUEVO: API de presencia del SO
contextBridge.exposeInMainWorld("presence", {
  subscribe: (
    cb: (
      ev:
        | "app:suspend"
        | "app:resume"
        | "app:lock"
        | "app:unlock"
        | "app:shutdown"
        | "app:minimized-all" // ⬅️ agregados
        | "app:restored-any" // ⬅️ agregados
    ) => void
  ) => {
    const channel = "presence:event";
    const handler = (_: any, ev: any) => cb(ev);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.off(channel, handler);
  },
});

contextBridge.exposeInMainWorld("timer", {
  enable: (p: { lawyerId: string; appVersion?: string }) =>
    ipcRenderer.invoke("timer:enable", p),
  disable: (opts?: { preserveDay?: boolean }) =>
    ipcRenderer.invoke("timer:disable", opts),

  start: (t: { type: string; id: string }) =>
    ipcRenderer.invoke("timer:start", t),

  // ⬇️ importante: ahora admite endMs y lo manda como objeto
  pause: (arg: any) => {
    const payload =
      typeof arg === "string"
        ? { reason: arg } // compat: "idle" | "switch" | ...
        : arg; // { reason, effectiveEndMs? }
    return ipcRenderer.invoke("timer:pause", payload);
  },
  /* pause: (
    reason: "idle" | "switch" | "close" | "logout" | "suspend",
    effectiveEndMs?: number
  ) => ipcRenderer.invoke("timer:pause", { reason, effectiveEndMs }), */

  switchTo: (t: { type: string; id: string } | null) =>
    ipcRenderer.invoke("timer:switchTo", t),

  workStart: () => ipcRenderer.invoke("timer:workStart"),
  workPause: (effectiveEndMs?: number) =>
    ipcRenderer.invoke("timer:workPause", effectiveEndMs),
  markActivity: () => ipcRenderer.send("timer:activity"),

  alignedStop: (reason: string) =>
    ipcRenderer.invoke("timer:alignedStop", reason),

  subscribe: async (cb: (partialMirror: any) => void) => {
    const listener = (_: any, mirror: any) => cb(mirror);
    ipcRenderer.on("timer:state", listener);
    const first = await ipcRenderer.invoke("timer:getMirror");
    cb(first);
    return () => ipcRenderer.removeListener("timer:state", listener);
  },
});

contextBridge.exposeInMainWorld("sync", {
  flushNow: () => ipcRenderer.invoke("sync:flushNow"),
  getStatus: () => ipcRenderer.invoke("sync:getStatus"),
  authSetToken: (t: string | null) => ipcRenderer.send("auth:setToken", t),
  onlineHint: () => ipcRenderer.send("net:online"),
});

/* contextBridge.exposeInMainWorld("timerGlobal", {
  getSnapshot: () => ipcRenderer.invoke("globalTimer:getSnapshot"),
  setSnapshot: (snap: {
    dayKey: string;
    accumSecToday: number;
    runningSince?: number | null;
  }) => ipcRenderer.invoke("globalTimer:setSnapshot", snap),
  clearSnapshot: () => ipcRenderer.invoke("globalTimer:clearSnapshot"),
}); */

contextBridge.exposeInMainWorld("electronAPI", {
  // Enviar datos desde React al proceso principal (main)
  send: (channel: string, data?: any) => {
    ipcRenderer.send(channel, data);
  },

  // Escuchar eventos desde el proceso principal
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },

  // Usar promesas para pedir algo al proceso principal y esperar una respuesta
  invoke: (channel: string, data?: any) => {
    return ipcRenderer.invoke(channel, data);
  },

  // Abre diálogo para seleccionar un archivo
  seleccionarArchivo: () => ipcRenderer.invoke("abrir-dialogo"),

  // ⬇️ NUEVO: API para cola de TimeEntry
  timeQueue: {
    appendEntry: (entry: TimeEntry): Promise<number> =>
      ipcRenderer.invoke("timeQueue:appendEntry", entry),

    getPending: (): Promise<TimeEntry[]> =>
      ipcRenderer.invoke("timeQueue:getPending"),

    setPending: (entries: TimeEntry[]): Promise<number> =>
      ipcRenderer.invoke("timeQueue:setPending", entries),

    clear: (): Promise<number> => ipcRenderer.invoke("timeQueue:clear"),

    count: (): Promise<number> => ipcRenderer.invoke("timeQueue:count"),
  },
});

/** ==================== NUEVO: API del visor ==================== */
// Manejador local para "viewer:addDocs" (buffer temporal)
// Si no hay suscriptor, guardamos los payloads entrantes en un array
// para entregarlos cuando alguien se suscriba.
let _viewerSubscriber: ((p: any) => void) | null = null;
let _pendingViewerPayloads: any[] = [];

// Escuchá SIEMPRE el canal, haya o no suscriptor:
ipcRenderer.on("viewer:addDocs", (_e, data) => {
  if (_viewerSubscriber) _viewerSubscriber(data);
  else _pendingViewerPayloads.push(data);
});

contextBridge.exposeInMainWorld("viewer", {
  open: (payload: { docs: any[]; activeId?: string | null }) =>
    ipcRenderer.invoke("viewer:open", payload),

  addDocs: (payload: { docs: any[]; activeId?: string | null }) =>
    ipcRenderer.send("viewer:addDocs", payload),

  close: () => ipcRenderer.send("viewer:close"),

  onAddDocs: (cb: any) => {
    _viewerSubscriber = cb;
    // Reproducí lo que haya llegado antes de suscribirte
    if (_pendingViewerPayloads.length) {
      for (const p of _pendingViewerPayloads) cb(p);
      _pendingViewerPayloads = [];
    }
    return () => {
      _viewerSubscriber = null;
    };
  },
});
/** =============================================================== */

// ===== Buffer/Subscriber para AUDIENCES =====
let _audViewerSubscriber: ((p: any) => void) | null = null;
let _pendingAudViewerPayloads: any[] = [];

// escuchar SIEMPRE el canal de audiencias:
ipcRenderer.on("viewer:audience:addDocs", (_e, data) => {
  if (_audViewerSubscriber) _audViewerSubscriber(data);
  else _pendingAudViewerPayloads.push(data);
});

// ===== API del visor de AUDIENCIAS =====
contextBridge.exposeInMainWorld("audienceViewer", {
  open: (payload: { audiences: any[]; activeId?: string | null }) =>
    ipcRenderer.invoke("viewer:audience:open", payload),

  addDocs: (payload: { audiences: any[]; activeId?: string | null }) =>
    ipcRenderer.send("viewer:audience:addDocs", payload),

  close: () => ipcRenderer.send("viewer:audience:close"),

  onAddDocs: (cb: any) => {
    _audViewerSubscriber = cb;
    if (_pendingAudViewerPayloads.length) {
      for (const p of _pendingAudViewerPayloads) cb(p);
      _pendingAudViewerPayloads = [];
    }
    return () => {
      _audViewerSubscriber = null;
    };
  },
});

/** =============================================================== */

// 🔵 Deep link de reseteo de contraseña
contextBridge.exposeInMainWorld("authDeepLink", {
  /**
   * Te avisa cuando main recibe ibarrayasoc://reset?token=XYZ
   * Devuelve un unsub para limpiar el listener.
   */
  onResetLink: (cb: (token: string) => void) => {
    const channel = "reset-password:open";
    const handler = (_: any, token: string) => {
      if (typeof token === "string" && token.length > 0) cb(token);
    };
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.off(channel, handler);
  },
});

/** =============================================================== */

// Allowlist simple para evitar abrir cualquier cosa
const ALLOWED_PREFIXES = [
  "https://meet.google.com/",
  "https://zoom.us/j/",
  "https://teams.microsoft.com/l/meetup-join/",
];

function isAllowedUrl(url: string) {
  return ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

async function openExternal(url: string): Promise<boolean> {
  try {
    if (!url) return false;
    // Normalización simple (sin protocolos raros)
    const safeUrl = url.trim();
    if (!isAllowedUrl(safeUrl)) return false;

    await shell.openExternal(safeUrl);
    return true;
  } catch {
    return false;
  }
}

// Exponemos una API mínima y clara
contextBridge.exposeInMainWorld("api", {
  openExternal,
});
