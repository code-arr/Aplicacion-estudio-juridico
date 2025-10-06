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
/* import { registerGlobalTimerHandlers } from "./ipc/globalTimerHandlers.js"; */
import { createMainSyncService } from "./sync/syncService.js";
import { createSyncApi } from "./sync/syncApi.js";
import { registerTimerIpc, timerShutdown } from "./timer/ipc.js";
import { registerTimeQueueHandlers } from "./ipc/timeQueueHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.resolve(__dirname, "../../.env") });

console.log("DEV_URL:", process.env.VITE_DEV_SERVER_URL);

let _authToken: string | null = null;

// ⚙️ Config del back (no el Vite server)
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

const syncApi = createSyncApi({
  baseUrl: API_BASE_URL,
  getAuthToken: () => _authToken,
});
const syncService = createMainSyncService({ api: syncApi });

// =============================================

let mainWindow: BrowserWindow | null = null;

/** ==================== NUEVO: estado de la ventana del visor de documentos ==================== */
let viewerWindow: BrowserWindow | null = null;

function createViewerWindow() {
  if (!mainWindow) return null; // 👈 asegura que haya padre

  if (viewerWindow && !viewerWindow.isDestroyed()) {
    return viewerWindow;
  }

  viewerWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    parent: mainWindow,
    modal: false,
    icon: path.join(__dirname, "assets", "logo-iya.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Visor de documentos",
  });

  registerWindowVisibility(viewerWindow);

  // Carga la app con la ruta del visor
  if (process.env.VITE_DEV_SERVER_URL) {
    viewerWindow.loadURL(
      `${process.env.VITE_DEV_SERVER_URL}#/viewer/documents`
    );
    viewerWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    viewerWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/viewer/documents",
    });
  }

  viewerWindow.on("closed", () => {
    viewerWindow = null;
  });

  return viewerWindow;
}
/** ============================================================================== */

/** ==================== NUEVO: estado de la ventana del visor de audiencias ==================== */
let audienceViewerWindow: BrowserWindow | null = null;

function createAudienceViewerWindow() {
  if (!mainWindow) return null; // 👈 asegura que haya padre

  if (audienceViewerWindow && !audienceViewerWindow.isDestroyed()) {
    return audienceViewerWindow;
  }

  audienceViewerWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    parent: mainWindow,
    modal: false,
    icon: path.join(__dirname, "assets", "logo-iya.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Audiencias (visor)",
  });

  registerWindowVisibility(audienceViewerWindow);

  // DEV vs PROD
  if (process.env.VITE_DEV_SERVER_URL) {
    audienceViewerWindow.loadURL(
      `${process.env.VITE_DEV_SERVER_URL}#/viewer/audiences`
    );
    audienceViewerWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    audienceViewerWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/viewer/audiences",
    });
  }

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
  console.log("[ICON PATH]", iconPath, "exists:", fs.existsSync(iconPath));

  const iconImg = nativeImage.createFromPath(iconPath);
  console.log("[ICON EMPTY?]", iconImg.isEmpty());

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

  /*   registerGlobalTimerHandlers(); */
  registerPresenceIpc();
  registerWindowVisibility(mainWindow);

  // Si estamos en desarrollo, cargamos el servidor de Vite
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}`);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // ⬇️ el index real está en front/dist/index.html
    const indexHtml = path.join(__dirname, "..", "..", "dist", "index.html");
    mainWindow.loadFile(indexHtml);
    mainWindow.webContents.on("did-finish-load", () => {
      // ajustá a tu ruta por defecto si no querés ir al viewer
      mainWindow!.webContents.executeJavaScript(
        `window.location.hash = '#/viewer'`
      );
    });
  }

  // (opcional) si querés limpiar refs al cerrarse
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

// Evento cuando la app está lista
app.whenReady().then(() => {
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
});

app.on("before-quit", () => {
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

/** ==================== NUEVO: API del visor por IPC ==================== */
ipcMain.handle(
  "viewer:open",
  async (_event, payload: { docs: any[]; activeId?: string | null }) => {
    const win = createViewerWindow();
    if (!win) return false; // 👈 por si no hay mainWindow
    if (win.isMinimized()) win.restore();
    win.show();

    const send = () => win.webContents.send("viewer:addDocs", payload);
    if (win.webContents.isLoading()) {
      win.webContents.once("did-finish-load", send);
    } else {
      send();
    }

    return true;
  }
);

ipcMain.on(
  "viewer:addDocs",
  (_event, payload: { docs: any[]; activeId?: string | null }) => {
    const win = createViewerWindow();
    if (!win) return false; // 👈 por si no hay mainWindow
    if (win.isMinimized()) win.restore();
    win.focus();

    const send = () => win.webContents.send("viewer:addDocs", payload);
    if (win.webContents.isLoading()) {
      win.webContents.once("did-finish-load", send);
    } else {
      send();
    }
  }
);

ipcMain.on("viewer:close", () => {
  if (viewerWindow && !viewerWindow.isDestroyed()) {
    viewerWindow.close();
  }
});
/** ====================================================================== */

// ===== IPC: AUDIENCES VIEWER =====
ipcMain.handle(
  "viewer:audience:open",
  async (_event, payload: { audiences: any[]; activeId?: string | null }) => {
    const win = createAudienceViewerWindow();
    if (!win) return false; // 👈 por si no hay mainWindow
    if (win.isMinimized()) win.restore();
    win.show();

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
    win.focus();

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
