import { updateDocumentActiveTime } from "@/api/document";
import type { HeartbeatEntry } from "../../electron/store/timeBufferStore";

// Detecto si estoy en Electron (preload expuso electronAPI)
type ElectronTB = {
  append: (entry: HeartbeatEntry) => Promise<number | void>;
  getPending: () => Promise<HeartbeatEntry[]>;
  setPending: (entries: HeartbeatEntry[]) => Promise<number | void>;
  clear: () => Promise<number | void>;
  count: () => Promise<number>;
};

const electronTB: ElectronTB | undefined =
  (typeof window !== "undefined" && window.electronAPI?.timeBuffer) ||
  undefined;

// Buffer en memoria cuando NO hay Electron (modo web)
const webPending: HeartbeatEntry[] = [];

// (opcional) para evitar flush concurrentes
let flushing = false;

export const timeBuffer = {
  append: async (entry: HeartbeatEntry) => {
    if (electronTB) return window.electronAPI.timeBuffer.append(entry);
    webPending.push(entry);
  },

  // ✅ FLUSH cross-env (Electron o Web)
  flush: async (opts?: { maxRequests?: number }) => {
    const maxRequests = Math.max(1, opts?.maxRequests ?? 100);
    if (flushing) {
      // si ya hay un flush corriendo, devolvemos el estado actual
      const remaining = electronTB
        ? await electronTB.count()
        : webPending.length;
      return { sent: 0, remaining };
    }
    flushing = true;

    // helpers para unificar acceso a la cola
    const getPending = electronTB
      ? () => electronTB.getPending()
      : async () => webPending;

    const setPending = electronTB
      ? (arr: HeartbeatEntry[]) => electronTB.setPending(arr)
      : async (arr: HeartbeatEntry[]) => {
          webPending.length = 0;
          webPending.push(...arr);
        };

    const count = electronTB
      ? () => electronTB.count()
      : async () => webPending.length;

    let processed = 0;

    try {
      while (processed < maxRequests) {
        const pending = await getPending();
        if (!pending.length) break;

        // FIFO: tomo la primera
        const entry = pending[0];

        try {
          // Enviamos SOLO una entry (como querías)
          const res = await updateDocumentActiveTime(entry);

          if (res?.status === 200 && res.data?.ok) {
            // Quitar UNA instancia idéntica de la cola (defensivo)
            const still = await getPending();
            let removed = false;
            const remaining: HeartbeatEntry[] = [];
            for (const it of still) {
              if (
                !removed &&
                it.docId === entry.docId &&
                it.versionId === entry.versionId &&
                it.clientTs === entry.clientTs &&
                it.deltaSec === entry.deltaSec
              ) {
                removed = true;
                continue;
              }
              remaining.push(it);
            }
            await setPending(remaining);
            processed += 1;
          } else {
            // respuesta rara del server → corto y reintento después
            break;
          }
        } catch {
          // red/5xx/etc → corto y reintento después
          break;
        }
      }

      return { sent: processed, remaining: await count() };
    } finally {
      flushing = false;
    }
  },

  count: async () => {
    if (electronTB) return electronTB.count();
    return webPending.length;
  },
};
