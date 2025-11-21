// electron/main.ts
import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeImage,
  shell,
} from "electron";
import { config as loadEnv } from "dotenv";
import * as path from "path";
import fs from "fs";
import "./ipc/authHandlers.js";
import { fileURLToPath } from "url";
import {
  registerPresenceIpc,
  registerWindowVisibility,
} from "./presenceBridge.js";
import { createMainSyncService } from "./sync/syncService.js";
import { createSyncApi } from "./sync/syncApi.js";
import { registerTimerIpc, timerShutdown } from "./timer/ipc.js";
import { registerTimeQueueHandlers } from "./ipc/timeQueueHandlers.js";
import { createHash } from "crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { machineIdSync } = require("node-machine-id"); // ✅ CJS en ESM
const updaterPkg = require("electron-updater");
const autoUpdater = updaterPkg.autoUpdater ?? updaterPkg.default?.autoUpdater;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const _rawMachineId = machineIdSync(); // estable por equipo
const _deviceId = createHash("sha256")
  .update(_rawMachineId)
  .digest("hex")
  .slice(0, 64);

// ✅ REGISTRAR EL HANDLER *ANTES* DE CREAR VENTANAS
ipcMain.handle("device:getId", () => _deviceId);

ipcMain.handle("open-external", async (_e, rawUrl: string) => {
  try {
    if (typeof rawUrl !== "string" || !rawUrl.trim()) return false;
    const url = rawUrl.trim();
    const u = new URL(url);
    const host = u.hostname;

    const ALLOWED_HOSTS = new Set([
      "meet.google.com",
      "zoom.us",
      "teams.microsoft.com",
      "calendar.google.com",
      "accounts.google.com", // <--- AGREGÁ ESTO
    ]);

    const allowed = ALLOWED_HOSTS.has(host);
    console.log("[open-external]", { url, host, allowed });

    if (!allowed) return false;

    await shell.openExternal(url);
    return true; // <- IMPORTANTE
  } catch (e) {
    console.error("[open-external] ERROR:", e);
    return false;
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ELECTRON_DIST = __dirname; // .../dist-electron/electron
const RENDERER_DIST_SIBLING = path.join(ELECTRON_DIST, "..", "..", "dist");
const RENDERER_DIST_RESOURCES = path.join(process.resourcesPath, "dist"); // por si tu empaquetador mueve a /resources/dist

let _authToken: string | null = null;
let pendingResetToken: string | null = null;
let pendingOAuth: { status?: string; returnTo?: string } | null = null;

function findIndexHtml(): string {
  const candidates = [
    path.join(RENDERER_DIST_SIBLING, "index.html"), // patrón más común en dev/build local
    path.join(RENDERER_DIST_RESOURCES, "index.html"), // patrón común en empaquetado
    path.join(app.getAppPath(), "dist", "index.html"), // fallback extra
  ];

  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    console.error("[index.html] No se encontró en:", candidates);
    throw new Error("No se encontró index.html. Verifica tu build del front.");
  }
  console.log("[index.html] usando:", found);
  return found;
}

loadEnv({ path: path.resolve(__dirname, "../../.env") });

// ⚙️ Config del back (no el Vite server)
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

const syncApi = createSyncApi({
  baseUrl: API_BASE_URL,
  getAuthToken: () => _authToken,
});
const syncService = createMainSyncService({ api: syncApi });

// 🔵 ADD: pequeña utilidad para extraer token desde una URL del protocolo
function extractTokenFromDeepLink(
  urlOrArg: string | undefined | null
): string | null {
  try {
    if (!urlOrArg) return null;
    if (!urlOrArg.startsWith("ibarrayasoc://")) return null;
    const u = new URL(urlOrArg);
    return u.searchParams.get("token");
  } catch {
    return null;
  }
}

function extractOAuthFromDeepLink(
  urlOrArg: string | undefined | null
): { status?: string; returnTo?: string } | null {
  try {
    if (!urlOrArg) return null;

    // Normalizamos
    const lowerUrl = urlOrArg.toLowerCase();
    if (!lowerUrl.startsWith("ibarrayasoc://")) return null;

    const u = new URL(urlOrArg);

    // 🔍 FIX: Concatenamos host y pathname para buscar la keyword seguro
    // Esto arregla "oauth-callback/?" y "oauth-callback?"
    const urlPathInfo = (u.host + u.pathname).toLowerCase();

    if (!urlPathInfo.includes("oauth-callback")) return null;

    const status = u.searchParams.get("status") || undefined;
    const returnTo = u.searchParams.get("returnTo") || undefined;

    return { status, returnTo };
  } catch (e) {
    sendMainLog("error", "Error parseando deep link:", e); // Usamos tu logger
    return null;
  }
}

// =============================================

let mainWindow: BrowserWindow | null = null;

// buffer temporal para logs que llegan antes de que el renderer esté listo
let _pendingMainLogs: Array<{ level: string; payload: string[] }> = [];

/** Reemplazar tu sendMainLog por esta versión */
function sendMainLog(
  level: "info" | "warn" | "error" | "debug",
  ...args: any[]
) {
  // logear en main (stdout)
  const prefix = `[main:${level}]`;
  if (level === "error") console.error(prefix, ...args);
  else if (level === "warn") console.warn(prefix, ...args);
  else console.log(prefix, ...args);

  // convertir payload a strings JSON-safe
  const payload = args.map((a) => {
    try {
      if (typeof a === "string") return a;
      return JSON.stringify(a, Object.getOwnPropertyNames(a));
    } catch {
      return String(a);
    }
  });

  try {
    // si no hay ventana todavía, o la webContents sigue cargando, pusheamos al buffer
    if (
      !mainWindow ||
      !mainWindow.webContents ||
      mainWindow.webContents.isLoading()
    ) {
      _pendingMainLogs.push({ level, payload });
      return;
    }

    // enviamos inmediatamente si el renderer está listo
    mainWindow.webContents.send("main:log", { level, payload });
  } catch (e) {
    console.error("[main:log] failed to send to renderer", e);
  }
}

/** ==================== NUEVO: estado de la ventana del visor de documentos ==================== */
let documentViewerWindow: BrowserWindow | null = null;

function createDocumentViewerWindow() {
  if (documentViewerWindow && !documentViewerWindow.isDestroyed()) {
    return documentViewerWindow;
  }

  documentViewerWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    skipTaskbar: false, // 👈 aseguralo
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "logo-iya.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Documentos (visor)",
    show: false,
  });

  registerWindowVisibility(documentViewerWindow);

  // Carga la app con la ruta del visor
  if (process.env.VITE_DEV_SERVER_URL) {
    documentViewerWindow.loadURL(
      `${process.env.VITE_DEV_SERVER_URL}#/viewer/documents`
    );
    documentViewerWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    documentViewerWindow.loadFile(findIndexHtml(), {
      hash: "/viewer/documents",
    });
  }

  documentViewerWindow.once("ready-to-show", () => {
    documentViewerWindow!.show();
    documentViewerWindow!.focus();
  });

  documentViewerWindow.on("closed", () => {
    documentViewerWindow = null;
  });

  return documentViewerWindow;
}
/** ============================================================================== */

/** ==================== NUEVO: estado de la ventana del visor de audiencias ==================== */
let audienceViewerWindow: BrowserWindow | null = null;

function createAudienceViewerWindow() {
  if (audienceViewerWindow && !audienceViewerWindow.isDestroyed()) {
    return audienceViewerWindow;
  }

  audienceViewerWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    skipTaskbar: false, // 👈 aseguralo
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "logo-iya.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Audiencias (visor)",
    show: false, // 👈 ver punto 2
  });

  registerWindowVisibility(audienceViewerWindow);

  // DEV vs PROD
  if (process.env.VITE_DEV_SERVER_URL) {
    audienceViewerWindow.loadURL(
      `${process.env.VITE_DEV_SERVER_URL}#/viewer/audiences`
    );
    audienceViewerWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    audienceViewerWindow.loadFile(findIndexHtml(), {
      hash: "/viewer/audiences",
    });
  }

  audienceViewerWindow.once("ready-to-show", () => {
    audienceViewerWindow!.show();
    audienceViewerWindow!.focus();
  });

  audienceViewerWindow.on("closed", () => {
    audienceViewerWindow = null;
  });

  return audienceViewerWindow;
}
/** ============================================================================== */

/** ==================== Crea la ventana principal de la aplicación. ==================== */
function getIconPath() {
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
    // en build, electron busca en resources
    return path.join(process.resourcesPath, "assets", "logo-iya.ico");
  }
  // en dev, apuntamos DIRECTO a src (dos niveles arriba de dist-electron/electron)
  return path.resolve(
    __dirname,
    "..",
    "..",
    "src",
    "assets",
    "logos",
    "logo-i&a-2.png"
  );
}

function createWindow() {
  const iconPath = getIconPath();

  const iconImg = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    icon: iconImg,
    show: false, // primero la creamos oculta
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // cuando esté lista, la maximizás y recién ahí la mostrás
  mainWindow.once("ready-to-show", () => {
    mainWindow!.maximize();
    mainWindow!.show();
  });

  registerPresenceIpc();
  registerWindowVisibility(mainWindow);

  // Si estamos en desarrollo, cargamos el servidor de Vite
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(findIndexHtml());
    /* mainWindow.webContents.on("did-finish-load", () => {
      // ajustá a tu ruta por defecto si no querés ir al viewer
      mainWindow!.webContents.executeJavaScript(
        `window.location.hash = '#/viewer'`
      );
    }); */
  }

  const sendPendingToken = () => {
    if (pendingResetToken && mainWindow) {
      mainWindow.webContents.send("reset-password:open", pendingResetToken);
      pendingResetToken = null;
    }
    if (pendingOAuth && mainWindow) {
      mainWindow.webContents.send("oauth-deeplink", pendingOAuth);
      pendingOAuth = null;
    }
  };

  // FLUSH adicional: enviamos los logs pendientes cuando terminó de cargar el renderer
  const flushPendingMainLogs = () => {
    try {
      if (mainWindow && mainWindow.webContents && _pendingMainLogs.length) {
        for (const l of _pendingMainLogs) {
          mainWindow.webContents.send("main:log", l);
        }
        _pendingMainLogs = [];
      }
    } catch (e) {
      console.error("[main:log] flush failed", e);
    }
  };

  if (mainWindow.webContents.isLoading()) {
    mainWindow.webContents.once("did-finish-load", () => {
      sendPendingToken();
      flushPendingMainLogs();
    });
  } else {
    sendPendingToken();
    flushPendingMainLogs();
  }

  mainWindow.on("closed", () => {
    // cerrá visores si viven
    if (documentViewerWindow && !documentViewerWindow.isDestroyed())
      documentViewerWindow.close();
    if (audienceViewerWindow && !audienceViewerWindow.isDestroyed())
      audienceViewerWindow.close();
    mainWindow = null;
  });

  return mainWindow;
}

// Función auxiliar para traer al frente a la fuerza (Truco para Windows)
function forceFocus(win: BrowserWindow) {
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();

  // 🪄 El truco mágico: ponerla on-top un instante
  win.setAlwaysOnTop(true);
  setTimeout(() => {
    win.setAlwaysOnTop(false);
    win.moveTop(); // Refuerzo para macOS
  }, 100);
}

// 🔵 ADD: single instance + manejo de argv (Windows/Linux)
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    sendMainLog("info", "second-instance argv", argv);

    // 1. Traer ventana al frente PRIMERO si ya existe
    if (mainWindow) {
      forceFocus(mainWindow);
    }

    // 2. Buscar si hay URL
    const argWithUrl = argv.find(
      (a) => typeof a === "string" && a.startsWith("ibarrayasoc://")
    );

    if (argWithUrl) {
      sendMainLog("debug", "URL detectada en argv:", argWithUrl);
    }

    // 3. Procesar Token (Reset Password)
    const token = extractTokenFromDeepLink(argWithUrl || null);
    if (token) {
      if (mainWindow) {
        sendMainLog("info", "Enviando token de reset password");
        mainWindow.webContents.send("reset-password:open", token);
      } else {
        pendingResetToken = token;
      }
    }

    // 4. Procesar OAuth (Google Login)
    if (argWithUrl) {
      // Usamos la función corregida
      const oauth = extractOAuthFromDeepLink(argWithUrl);

      if (oauth) {
        if (mainWindow && mainWindow.webContents) {
          // 👇 ACÁ ES DONDE QUEREMOS VER EL LOG EN TU CONSOLA
          sendMainLog("info", "🚀 OAuth detectado, enviando a React:", oauth);
          mainWindow.webContents.send("oauth-deeplink", oauth);
        } else {
          sendMainLog(
            "warn",
            "OAuth detectado pero ventana no lista. Guardando pendiente."
          );
          pendingOAuth = oauth;
        }
      } else {
        // Si entra acá, es porque falló el parser (o no era oauth)
        sendMainLog(
          "warn",
          "⚠️ URL detectada pero extractOAuth devolvió null",
          argWithUrl
        );
      }
    }
  });
}

// Evento cuando la app está lista
app.whenReady().then(() => {
  if (process.platform === "win32") {
    // En dev: usar el ejecutable; en build: podés usar tu appId fijo si querés
    const id = app.isPackaged ? "com.iya.desktop" : process.execPath;
    app.setAppUserModelId(id);
  }

  // 🔵 ADD: registrar el protocolo personalizado (dev y prod)
  try {
    app.setAsDefaultProtocolClient("ibarrayasoc");
  } catch (e) {
    console.warn(
      "[protocol] No se pudo registrar 'ibarrayasoc' en este entorno:",
      e
    );
  }

  registerTimerIpc(); // ✅ ahora el motor y powerMonitor quedan online desde el inicio
  registerTimeQueueHandlers();

  // (Opcional) IPC para sync si tu servicio no los registra internamente.
  // Si ya los registrás en createMainSyncService, podés borrar estas dos líneas.
  ipcMain.handle("sync:flushNow", () => syncService.flushNow?.());
  ipcMain.handle("sync:getStatus", () => syncService.getStatus?.());

  syncService.scheduleAutoFlush(); // arrancá el loop

  const win = createWindow(); // guarda la ref principal

  // auto-updates (solo en build empaquetada)
  type UpdateInfo = {
    version?: string;
    releaseName?: string;
    releaseNotes?:
      | string
      | { title?: string; body?: string }
      | Array<{ title?: string; body?: string }>;
    files?: Array<{ url?: string; name?: string }>;
  };

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on("checking-for-update", () => {
      console.log("[autoUpdater] checking for update...");
    });

    autoUpdater.on("update-available", (info: UpdateInfo) => {
      const ver = info?.version ?? "unknown";
      console.log("[autoUpdater] update available:", ver);
      mainWindow?.webContents.send("app:update-available", info);
    });

    autoUpdater.on("update-not-available", () => {
      console.log("[autoUpdater] no update available");
    });

    autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
      const ver = info?.version ?? "unknown";
      console.log("[autoUpdater] update downloaded:", ver);
      mainWindow?.webContents.send("app:update-downloaded", info);
      // esperar confirmación del usuario para instalar
    });

    autoUpdater.on("error", (err: unknown) => {
      // normalizamos el error para loggear algo útil sin asumir shape
      const message = err instanceof Error ? err.message : String(err);
      console.error("[autoUpdater] error:", message, err);
    });

    // IPC: si el renderer pide instalar la actualización
    ipcMain.on("app:update-install", () => {
      try {
        autoUpdater.quitAndInstall(
          true, // ✅ PONELO EN TRUE (Modo Silencioso)
          true // Reiniciar después
        );
      } catch (e) {
        console.error("[autoUpdater] quitAndInstall error:", e);
      }
    });
  }

  // En macOS, reabre una ventana si no hay ninguna activa
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // 🔵 ADD: si la app se inició con el deep link (Windows primera instancia)
  if (process.platform === "win32") {
    const urlArg = process.argv.find(
      (a) => typeof a === "string" && a.startsWith("ibarrayasoc://")
    );
    const token = extractTokenFromDeepLink(urlArg || null);
    if (token) {
      // si el front aún no cargó, se envía después (ver punto 2)
      pendingResetToken = token;
      // intento enviarlo ya por si ya cargó:
      if (mainWindow && !mainWindow.webContents.isLoading()) {
        mainWindow.webContents.send("reset-password:open", token);
        pendingResetToken = null;
      }
    }

    const oauthFromArg = extractOAuthFromDeepLink(urlArg || null);
    if (oauthFromArg) {
      pendingOAuth = oauthFromArg;
      if (mainWindow && !mainWindow.webContents.isLoading()) {
        mainWindow.webContents.send("oauth-deeplink", oauthFromArg);
        pendingOAuth = null;
      }
    }
  }
});

// 🔵 ADD: macOS entrega el deep link por este evento
app.on("open-url", (event, url) => {
  event.preventDefault();
  sendMainLog("info", "open-url event", url);

  // 1. Traer ventana al frente PRIMERO
  if (mainWindow) {
    forceFocus(mainWindow);
  }

  // 2. Procesar Token
  const token = extractTokenFromDeepLink(url);
  sendMainLog("debug", { token });

  if (token) {
    if (mainWindow) {
      mainWindow.webContents.send("reset-password:open", token);
    } else {
      pendingResetToken = token;
    }
  }

  // 3. Procesar OAuth
  const oauth = extractOAuthFromDeepLink(url);
  if (oauth) {
    if (mainWindow) {
      mainWindow.webContents.send("oauth-deeplink", oauth);
    } else {
      pendingOAuth = oauth;
    }
  }
});

app.on("before-quit", () => {
  if (documentViewerWindow && !documentViewerWindow.isDestroyed())
    documentViewerWindow.close();
  if (audienceViewerWindow && !audienceViewerWindow.isDestroyed())
    audienceViewerWindow.close();
  try {
    timerShutdown();
  } catch (e) {
    console.error("[timerShutdown]", e);
  }
});

// Evento cuando se cierran todas las ventanas
app.on("window-all-closed", () => {
  // En Windows/Linux cerramos la app, en macOS no
  if (process.platform !== "darwin") app.quit();
});

// Dialogo abrir archivo
ipcMain.handle("abrir-dialogo", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Documentos", extensions: ["pdf"] }],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Hints desde renderer (opcional pero útil)
ipcMain.on("auth:setToken", (_e, token: string | null) => {
  _authToken = token || null;
  syncService.onAuthOk();
});
ipcMain.on("net:online", () => syncService.onOnline());

/** ====================================================================== */

/** ==================== IPC: DOCUMENTS VIEWER ==================== */
ipcMain.handle("viewer:open", async (_event, payload) => {
  const win = createDocumentViewerWindow();
  if (!win) return false;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  win.moveTop?.();

  const send = () => win.webContents.send("viewer:addDocs", payload);
  if (win.webContents.isLoading())
    win.webContents.once("did-finish-load", send);
  else send();
  return true;
});

ipcMain.on("viewer:addDocs", (_event, payload) => {
  const win = createDocumentViewerWindow();
  if (!win) return false;
  if (win.isMinimized()) win.restore();
  win.show(); // 👈 faltaba
  win.focus(); // 👈 faltaba
  win.moveTop?.(); // 👈 sugerido

  const send = () => win.webContents.send("viewer:addDocs", payload);
  if (win.webContents.isLoading())
    win.webContents.once("did-finish-load", send);
  else send();
});

ipcMain.on("viewer:close", () => {
  if (documentViewerWindow && !documentViewerWindow.isDestroyed()) {
    documentViewerWindow.close();
  }
});

ipcMain.on("viewer:closeById", (_event, id: string) => {
  const win = createDocumentViewerWindow(); // garantiza que exista si la abrís al vuelo
  if (!win) return;
  if (win.isMinimized()) win.restore();
  // reenviamos al renderer del visor
  const send = () => win.webContents.send("viewer:closeById", id);
  if (win.webContents.isLoading())
    win.webContents.once("did-finish-load", send);
  else send();
});
/** ====================================================================== */

/** ==================== IPC: AUDIENCES VIEWER ==================== */
ipcMain.handle(
  "viewer:audience:open",
  async (_event, payload: { audiences: any[]; activeId?: string | null }) => {
    const win = createAudienceViewerWindow();
    if (!win) return false; // 👈 por si no hay mainWindow
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus(); // 👈 faltaba
    win.moveTop?.(); // 👈 sugerido

    const send = () => win.webContents.send("viewer:audience:addDocs", payload);
    if (win.webContents.isLoading()) {
      win.webContents.once("did-finish-load", send);
    } else {
      send();
    }
    return true;
  }
);

ipcMain.on(
  "viewer:audience:addDocs",
  (_event, payload: { audiences: any[]; activeId?: string | null }) => {
    const win = createAudienceViewerWindow();
    if (!win) return false; // 👈 por si no hay mainWindow
    if (win.isMinimized()) win.restore();
    win.show(); // 👈 faltaba
    win.focus();
    win.moveTop?.(); // 👈 sugerido

    const send = () => win.webContents.send("viewer:audience:addDocs", payload);
    if (win.webContents.isLoading()) {
      win.webContents.once("did-finish-load", send);
    } else {
      send();
    }
  }
);

ipcMain.on("viewer:audience:close", () => {
  if (audienceViewerWindow && !audienceViewerWindow.isDestroyed()) {
    audienceViewerWindow.close();
  }
});

ipcMain.on("viewer:audience:closeById", (_event, id: string) => {
  const win = createAudienceViewerWindow();
  if (!win) return;
  if (win.isMinimized()) win.restore();
  const send = () => win.webContents.send("viewer:audience:closeById", id);
  if (win.webContents.isLoading())
    win.webContents.once("did-finish-load", send);
  else send();
});

process.on("uncaughtException", (err) => {
  sendMainLog("error", "uncaughtException", err && err.stack ? err.stack : err);
});
process.on("unhandledRejection", (reason) => {
  sendMainLog("error", "unhandledRejection", reason);
});
