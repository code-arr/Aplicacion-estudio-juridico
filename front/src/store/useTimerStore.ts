import { create } from "zustand";
import type { TimerStatus, Trackable, PauseReason } from "@/types/Timer";
import { pauseTimer, startTimer } from "@/api/timer";

// Opcional: datos de arranque (por si querés pasar source/lawyerId)
export type StartOpts = {
  source?: "auto" | "manual";
  lawyerId?: string;
};

interface TimerState {
  active?: Trackable | null;
  status: TimerStatus;
  lastActivityAt: number;
  idleLimitMs: number;

  start: (
    trackable: Trackable,
    opts?: StartOpts
  ) => Promise<void> /* pausa si corresponde; POST /timers/start; set state; ensure interval */;
  pause: (
    reason: PauseReason
  ) => Promise<void> /* POST /timers/pause; set state paused o stopped */;
  switchTo: (
    trackable: Trackable,
    opts?: StartOpts
  ) => Promise<void> /* pause('switch'); start(trackable) */;
  markActivity: () => void /* bump lastActivityAt; si estaba paused por idle, reanudar */;
  setIdleLimit: (ms: number) => void /* set({ idleLimitMs: ms }) */;
}

// ===== Idle loop (único) =====
// Guardamos el id del intervalo fuera del store para que sea singleton.
let idleTimerId: number | null = null;
const IDLE_TICK_MS = 5000;

// Enciende el loop si aún no está encendido.
function ensureIdleLoop() {
  if (idleTimerId !== null) return;
  idleTimerId = window.setInterval(() => {
    const s = useTimerStore.getState();
    if (s.status === "running" && s.active) {
      const now = Date.now();
      if (now - s.lastActivityAt > s.idleLimitMs) {
        // Pausa por inactividad (no await acá para no bloquear el loop)
        s.pause("idle").catch((e) => {
          // En MVP: logueamos y seguimos
          console.error("[Timer] pause(idle) failed:", e);
        });
      }
    }
  }, IDLE_TICK_MS);
}

// (Opcional) Apagar el loop si no hay tracking activo
function maybeStopIdleLoop() {
  const s = useTimerStore.getState();
  const shouldKeep =
    s.status === "running" || (s.status === "paused" && !!s.active);
  if (!shouldKeep && idleTimerId !== null) {
    clearInterval(idleTimerId);
    idleTimerId = null;
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  active: null,
  status: "stopped",
  lastActivityAt: 0,
  idleLimitMs: 90_000,

  // Inicia tracking "auto" o "manual" para un trackable
  start: async (trackable, opts) => {
    const { active, status } = get();

    // Si hay otro activo distinto y está corriendo, pausamos primero
    if (
      active &&
      (active.id !== trackable.id || active.type !== trackable.type) &&
      status === "running"
    ) {
      await get().pause("switch");
    }

    // Optimista: seteamos estado running ya
    set({
      active: trackable,
      status: "running",
      lastActivityAt: Date.now(),
    });

    // Aseguramos loop de idle
    ensureIdleLoop();

    try {
      await startTimer(trackable, opts);
    } catch (err) {
      console.error("[Timer] start failed:", err);
      // Revertimos a estado previo si falló
      set({ status: "stopped", active: null });
      maybeStopIdleLoop();
      throw err;
    }
  },

  // Pausa el tracking actual (idle/switch/close/manual)
  pause: async (reason) => {
    const { active, status } = get();
    if (!active || status !== "running") {
      // Nada que pausar
      return;
    }

    // Optimista: marcamos paused (o stopped si es cierre)
    set({ status: reason === "close" ? "stopped" : "paused" });

    try {
      await pauseTimer(active, reason);
    } catch (err) {
      console.error(`[Timer] pause(${reason}) failed:`, err);
      // Si falló, volvemos a running para no “perder” el estado
      set({ status: "running" });
      throw err;
    } finally {
      // Si se cerró, limpiamos el active y quizá apagamos loop
      if (reason === "close") {
        set({ active: null });
        maybeStopIdleLoop();
      }
    }
  },

  // Azúcar: pausa el actual (si aplica) y arranca el nuevo
  switchTo: async (trackable, opts) => {
    const { active, status } = get();
    if (
      active &&
      status === "running" &&
      (active.id !== trackable.id || active.type !== trackable.type)
    ) {
      await get().pause("switch");
    }
    await get().start(trackable, opts);
  },

  // Marca actividad (mousemove/keydown/scroll/etc.)
  markActivity: () => {
    const { status, active } = get();
    const now = Date.now();
    set({ lastActivityAt: now });

    // Si estaba pausado por idle (o en general), reanudamos automáticamente
    if (status === "paused" && active) {
      // Reanudamos sin cambiar de contexto
      get()
        .start(active, { source: "auto" })
        .catch((e) =>
          console.error("[Timer] resume via markActivity failed:", e)
        );
    }
  },

  setIdleLimit: (ms) => set({ idleLimitMs: Math.max(15_000, ms | 0) }), // mínimo 15s para evitar locuras
}));
