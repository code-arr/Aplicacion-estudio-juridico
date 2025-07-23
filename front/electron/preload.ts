import { contextBridge, ipcRenderer } from "electron";

/**
 * Expone funciones seguras al frontend a través de window.electronAPI
 *
 * ✅ Estamos listos para:
 * - Enviar eventos (send)
 * - Escuchar eventos (on)
 * - Pedir algo y recibir una respuesta (invoke)
 */
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
});
