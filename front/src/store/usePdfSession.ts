import { create } from "zustand";
import { timeBuffer } from "@/services/timeBuffer";

// Umbrales (ajustá a gusto)
const IDLE_SEC = 180; // sin actividad => pausa
const ENQUEUE_EVERY_SEC = 60; // cada 60s encolamos heartbeat

type SessionStatus = "idle" | "active" | "paused";

type DocSession = {
  status: SessionStatus;
  lastActivityAt: number; // Date.now()
  totalActiveMs: number; // para UI (acumulado visible)
  activeBucketSec: number; // segundos desde el último enqueue
  versionId?: string; // útil para versionado
};

interface PdfManagerState {
  // Un dict por docId
  sessions: Record<string, DocSession>;
  // Guardamos el docId activo para poder garantizar exclusividad
  activeDocId: string | null;

  ensure: (docId: string, versionId?: string) => void;

  // Solo estado local
  resume: (docId: string) => void;
  pause: (docId: string) => void;

  // Actividad del usuario (mouse/scroll/keydown)
  markActivity: (docId: string) => void;

  // Avance de 1s desde tu hook (solo si está active y no idle)
  tickActive: (docId: string, sec?: number) => void;

  // Encola lo acumulado (si >= ENQUEUE_EVERY_SEC) en buffer local
  enqueueHeartbeat: (docId: string) => Promise<void>;

  // Fuerza encolar lo que falte (aunque sea < 60s)
  flushRemainder: (docId: string) => Promise<void>;

  // Cambia pestaña activa (pausa la anterior, resume la nueva)
  setActiveDoc: (docId: string | null, versionId?: string) => Promise<void>;
}

export const usePdfSessionStore = create<PdfManagerState>((set, get) => ({
  sessions: {},
  activeDocId: null,

  ensure: (docId) => {
    const { sessions } = get();
    if (!sessions[docId]) {
      set({
        sessions: {
          ...sessions,
          [docId]: {
            status: "idle",
            lastActivityAt: Date.now(),
            totalActiveMs: 0,
            activeBucketSec: 0,
          },
        },
      });
    } /* else if (versionId && sessions[docId].versionId !== versionId) {
      // Si cambió la versión en la misma pestaña
      set({
        sessions: {
          ...sessions,
          [docId]: { ...sessions[docId], versionId },
        },
      });
    } */
  },

  resume: (docId) => {
    const { sessions } = get();
    const s = sessions[docId];
    if (!s) return;
    set({
      sessions: {
        ...sessions,
        [docId]: { ...s, status: "active", lastActivityAt: Date.now() },
      },
    });
  },

  pause: (docId) => {
    const { sessions } = get();
    const s = sessions[docId];
    if (!s || s.status !== "active") return;
    set({
      sessions: {
        ...sessions,
        [docId]: { ...s, status: "paused" },
      },
    });
  },

  markActivity: (docId) => {
    const { sessions } = get();
    const s = sessions[docId];
    if (!s) return;
    set({
      sessions: {
        ...sessions,
        [docId]: { ...s, lastActivityAt: Date.now() },
      },
    });
  },

  tickActive: (docId, sec = 1) => {
    const { sessions } = get();
    const s = sessions[docId];
    if (!s || s.status !== "active") return;

    const now = Date.now();
    const idleSec = (now - s.lastActivityAt) / 1000;
    if (idleSec > IDLE_SEC) {
      // se volvió inactivo: pausar
      set({
        sessions: {
          ...sessions,
          [docId]: { ...s, status: "paused" },
        },
      });
      return;
    }

    const newTotalMs = s.totalActiveMs + sec * 1000;
    const newBucket = s.activeBucketSec + sec;

    set({
      sessions: {
        ...sessions,
        [docId]: {
          ...s,
          totalActiveMs: newTotalMs,
          activeBucketSec: newBucket,
        },
      },
    });

    // Si alcanzamos el umbral de envío, encolá (no esperamos aquí el await)
    if (newBucket >= ENQUEUE_EVERY_SEC) {
      get().enqueueHeartbeat(docId);
    }
  },

  enqueueHeartbeat: async (docId) => {
    const { sessions } = get();
    const s = sessions[docId];
    if (!s || s.activeBucketSec <= 0) return;

    const deltaSec = Math.floor(s.activeBucketSec);
    const clientTs = new Date().toISOString();
    try {
      await timeBuffer.append({
        docId,
        deltaSec,
        versionId: s.versionId,
        clientTs,
      });

      // Resetear bucket local
      set({
        sessions: {
          ...sessions,
          [docId]: { ...s, activeBucketSec: 0 },
        },
      });

      // Intento de flush (si hay red)
      await timeBuffer.flush();
    } catch (error) {
      console.log(error);
    }
  },

  flushRemainder: async (docId) => {
    const { sessions } = get();
    const s = sessions[docId];
    if (!s) return;
    if (s.activeBucketSec > 0) {
      await get().enqueueHeartbeat(docId);
    } else {
      try {
        // aunque no haya resto, intentá flush global por si hay pendientes de otros docs
        await timeBuffer.flush();
      } catch (error) {
        console.log(error);
      }
    }
  },

  setActiveDoc: async (newDocId) => {
    const { activeDocId, sessions, pause, resume, ensure, flushRemainder } =
      get();

    // 1) Si había uno activo, encolá lo que reste y pausá
    if (activeDocId) {
      await flushRemainder(activeDocId);
      pause(activeDocId);
    }

    // 2) Activar el nuevo (o ninguno)
    if (!newDocId) {
      set({ activeDocId: null });
      return;
    }

    ensure(newDocId);

    // Reanudar el nuevo
    resume(newDocId);
    set({ activeDocId: newDocId });
  },
}));
