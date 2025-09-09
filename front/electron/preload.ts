import { contextBridge, ipcRenderer } from "electron";

/**
 * Expone funciones seguras al frontend a través de window.electronAPI
 *
 * ✅ Estamos listos para:
 * - Enviar eventos (send)
 * - Escuchar eventos (on)
 * - Pedir algo y recibir una respuesta (invoke)
 * - Usar el buffer local de tiempo (timeBuffer.*) SIN tocar la red desde Electron
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

  // --- NUEVO: API local para el buffer de tiempo ---
  timeBuffer: {
    append: (entry: {
      docId: string;
      versionId?: string;
      deltaSec: number;
      clientTs: string;
    }): Promise<number> => ipcRenderer.invoke("timeBuffer:append", entry),

    getPending: (): Promise<
      Array<{
        docId: string;
        versionId?: string;
        deltaSec: number;
        clientTs: string;
      }>
    > => ipcRenderer.invoke("timeBuffer:getPending"),

    setPending: (
      entries: Array<{
        docId: string;
        versionId?: string;
        deltaSec: number;
        clientTs: string;
      }>
    ): Promise<number> => ipcRenderer.invoke("timeBuffer:setPending", entries),

    clear: (): Promise<number> => ipcRenderer.invoke("timeBuffer:clear"),

    count: (): Promise<number> => ipcRenderer.invoke("timeBuffer:count"),
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
