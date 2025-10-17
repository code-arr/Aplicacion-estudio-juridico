// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog, nativeImage } from "electron";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ELECTRON_DIST = __dirname; // .../dist-electron/electron
const RENDERER_DIST_SIBLING = path.join(ELECTRON_DIST, "..", "..", "dist");
const RENDERER_DIST_RESOURCES = path.join(process.resourcesPath, "dist"); // por si tu empaquetador mueve a /resources/dist

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

let _authToken: string | null = null;

// ⚙️ Config del back (no el Vite server)
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

const syncApi = createSyncApi({
  baseUrl: API_BASE_URL,
  getAuthToken: () => _authToken,
});
const syncService = createMainSyncService({ api: syncApi });

let pendingResetToken: string | null = null;

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

// =============================================

let mainWindow: BrowserWindow | null = null;

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
  };

  if (mainWindow.webContents.isLoading()) {
    mainWindow.webContents.once("did-finish-load", sendPendingToken);
  } else {
    sendPendingToken();
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

// 🔵 ADD: single instance + manejo de argv (Windows/Linux)
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    // En Windows, el deep link llega como argumento tipo: "ibarrayasoc://reset?token=..."
    const argWithUrl = argv.find(
      (a) => typeof a === "string" && a.startsWith("ibarrayasoc://")
    );
    const token = extractTokenFromDeepLink(argWithUrl || null);

    if (token) {
      if (mainWindow) {
        mainWindow.webContents.send("reset-password:open", token);
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      } else {
        pendingResetToken = token;
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
  }
});

// 🔵 ADD: macOS entrega el deep link por este evento
app.on("open-url", (event, url) => {
  event.preventDefault();
  const token = extractTokenFromDeepLink(url);
  if (!token) return;

  if (mainWindow) {
    mainWindow.webContents.send("reset-password:open", token);
    mainWindow.focus();
  } else {
    pendingResetToken = token;
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
