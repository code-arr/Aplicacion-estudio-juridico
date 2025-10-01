import { app, BrowserWindow, ipcMain, dialog, nativeImage } from "electron";
import { config as loadEnv } from "dotenv";
import * as path from "path";
import fs from "fs";
import "./ipc/authHandlers.js";
import { fileURLToPath } from "url";
import { registerTimeQueueHandlers } from "./ipc/timeQueueHandlers.js";
import {
  registerPresenceIpc,
  registerWindowVisibility,
} from "./presenceBridge.js";
import { registerGlobalTimerHandlers } from "./ipc/globalTimerHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.resolve(__dirname, "../../.env") });

console.log("DEV_URL:", process.env.VITE_DEV_SERVER_URL);

// =============================================

/** ==================== NUEVO: estado de la ventana del visor de documentos ==================== */
let viewerWindow: BrowserWindow | null = null;

function createViewerWindow() {
  if (viewerWindow && !viewerWindow.isDestroyed()) {
    return viewerWindow;
  }

  viewerWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    icon: path.join(__dirname, "assets", "logo-iya.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Visor de documentos",
  });

  registerWindowVisibility(viewerWindow); // ⬅️ AGREGA ESTO

  // Carga la app con la ruta del visor
  if (process.env.VITE_DEV_SERVER_URL) {
    viewerWindow.loadURL(
      `${process.env.VITE_DEV_SERVER_URL}#/viewer/documents`
    );
    viewerWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    viewerWindow.loadFile(
      path.join(__dirname, "../dist/index.html"),
      { hash: "/viewer/documents" } // ← carga directamente en #/view/documents
    );
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
  if (audienceViewerWindow && !audienceViewerWindow.isDestroyed()) {
    return audienceViewerWindow;
  }

  audienceViewerWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    icon: path.join(__dirname, "assets", "logo-iya.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Audiencias (visor)",
  });

  registerWindowVisibility(audienceViewerWindow); // ⬅️ AGREGA ESTO

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

  const win = new BrowserWindow({
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
  win.once("ready-to-show", () => {
    win.maximize();
    win.show();
  });

  registerTimeQueueHandlers();
  registerGlobalTimerHandlers();
  registerPresenceIpc();
  registerWindowVisibility(win); // ⬅️ NUEVO

  // Si estamos en desarrollo, cargamos el servidor de Vite
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}`);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // ⬇️ el index real está en front/dist/index.html
    const indexHtml = path.join(__dirname, "..", "..", "dist", "index.html");
    win.loadFile(indexHtml);

    win.webContents.on("did-finish-load", () => {
      win.webContents.executeJavaScript(`window.location.hash = '#/viewer'`);
    });
  }
}

// Evento cuando la app está lista
app.whenReady().then(() => {
  createWindow();

  // En macOS, reabre una ventana si no hay ninguna activa
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
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

/** ==================== NUEVO: API del visor por IPC ==================== */
/**
 * viewer:open (invoke)
 * - Garantiza que exista la ventana del visor
 * - La enfoca
 * - Envía payload de documentos al visor (como "viewer:addDocs")
 */
ipcMain.handle(
  "viewer:open",
  async (_event, payload: { docs: any[]; activeId?: string | null }) => {
    const win = createViewerWindow();
    // Enfocar/restaurar
    if (win.isMinimized()) win.restore();
    win.show();

    // Cuando el contenido está listo, enviamos los docs
    const send = () => win.webContents.send("viewer:addDocs", payload);
    if (win.webContents.isLoading()) {
      win.webContents.once("did-finish-load", send);
    } else {
      send();
    }

    return true;
  }
);

/**
 * viewer:addDocs (send)
 * - Envía nuevos documentos a la ventana del visor ya existente
 * - Si no existe, crea la ventana y los manda
 */
ipcMain.on(
  "viewer:addDocs",
  (_event, payload: { docs: any[]; activeId?: string | null }) => {
    const win = createViewerWindow();
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

/**
 * viewer:close (send)
 * - Cierra la ventana del visor si existe
 */
ipcMain.on("viewer:close", () => {
  if (viewerWindow && !viewerWindow.isDestroyed()) {
    viewerWindow.close();
  }
});
/** ====================================================================== */

// ===== IPC: AUDIENCES VIEWER =====

// abrir (garantiza/crea ventana, enfoca y manda payload)
ipcMain.handle(
  "viewer:audience:open",
  async (_event, payload: { audiences: any[]; activeId?: string | null }) => {
    const win = createAudienceViewerWindow();
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

// enviar docs a una ventana ya abierta (o crear si no existe)
ipcMain.on(
  "viewer:audience:addDocs",
  (_event, payload: { audiences: any[]; activeId?: string | null }) => {
    const win = createAudienceViewerWindow();
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

// cerrar la ventana de audiencias
ipcMain.on("viewer:audience:close", () => {
  if (audienceViewerWindow && !audienceViewerWindow.isDestroyed()) {
    audienceViewerWindow.close();
  }
});
