import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import "./ipc/authHandlers";

/**
 * Crea una nueva ventana de la aplicación.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      // Cargamos el preload.js como puente seguro
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // aísla el contexto de Node.js del frontend (más seguro)
      nodeIntegration: false, // no permite usar require o Node en React directamente
    },
  });

  // Si estamos en desarrollo, cargamos el servidor de Vite
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools(); // Abre las DevTools (F12)
  } else {
    // En producción, cargamos el HTML compilado por Vite
    win.loadFile(path.join(__dirname, "../dist/index.html"));
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

// Manejar selección de archivos
// -------------------
ipcMain.handle("abrir-dialogo", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Documentos", extensions: ["pdf"] }],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});
