// electron/timer/engine.ts
import { EventEmitter } from "events";
import type {
  TrackableType,
  PauseReason,
  TimerStatus,
} from "../../src/types/Timer.js";

const IDLE_LIMIT_MS = 90_000 as const;

export type Trackable = { type: TrackableType; id: string };

export type TimerState = {
  lawyerId?: string | null;
  appVersion?: string | null;
  global: {
    enabled: boolean;
    status: Extract<TimerStatus, "running" | "stopped">;
    startedAtUTC?: string; // inicio del “workday” ACTUAL (diagnóstico)
    lastActivityUTC?: string;
  };
  ctx: {
    active: Trackable | null;
    status: TimerStatus; // "running" | "paused" | "stopped"
    startedAtUTC?: string;
    lastPauseReason?: PauseReason | "midnight-internal";
  };
  metrics: {
    workTodaySec: number; // SIEMPRE entero, y solo cambia +1s por vez
    ctxRunningSec: number; // métrica visible, derivada por segundo
  };
};

const IDLE_SEC = Math.floor(IDLE_LIMIT_MS / 1000);
const MIN_SEGMENT_SEC = 3;

// YYYY-MM-DD local (no TZ especial)
function dayKeyLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

/** Segmento que el motor emite al cerrar un bloque */
export type EmittedSegment = {
  startMs: number;
  endMs: number;
  seconds: number;
  trackable: Trackable;
  reason: PauseReason | "midnight-internal";
  dayKey: string; // día del inicio (local)
};

export class TimerEngine extends EventEmitter {
  private state: TimerState = {
    lawyerId: null,
    appVersion: null,
    global: { enabled: false, status: "stopped" },
    ctx: { active: null, status: "stopped" },
    metrics: { workTodaySec: 0, ctxRunningSec: 0 },
  };

  private ticker?: NodeJS.Timeout;

  // 🔹 Base “persistida” del día (segundos acumulados ANTES del tramo en curso)
  private workTodayBaseSec = 0;

  // 🔹 Ancla del tramo global en curso (cuando global está “running”)
  private globalRunStartMs: number | null = null;

  // 🔹 Día actual (para corte a medianoche)
  private currentDayKey = dayKeyLocal();

  // 🔹 Último entero emitido (para no spamear)
  private lastEmittedWorkSec = 0;

  private lastActivityMs: number | null = null;

  private segmentEmitter?: (seg: EmittedSegment) => void;

  // =============== Snapshot diario ===============
  seedDailyBase(
    snap: {
      dayKey: string;
      accumSecToday: number;
      runningSince?: number | null;
    } | null
  ) {
    const today = dayKeyLocal();
    if (!snap || snap.dayKey !== today) {
      this.currentDayKey = today;
      this.workTodayBaseSec = 0;
      this.lastEmittedWorkSec = 0;
      this.state.metrics.workTodaySec = 0;
      // 🔑 Importante: no arrastramos tramo corriendo al boot
      this.globalRunStartMs = null;
      return;
    }

    this.currentDayKey = snap.dayKey;
    this.workTodayBaseSec = Math.max(0, Math.floor(snap.accumSecToday || 0));
    this.lastEmittedWorkSec = this.workTodayBaseSec;
    this.state.metrics.workTodaySec = this.workTodayBaseSec;

    // ❌ ANTES: si venía “running”, reanclabas desde snap.runningSince
    // ✅ AHORA: NO reanudamos automáticamente después de un reinicio
    this.globalRunStartMs = null; // 👈 clave para que no sume tiempo off-app
  }

  getDailySnapshot(): {
    dayKey: string;
    accumSecToday: number;
    runningSince?: number | null;
  } {
    return {
      dayKey: this.currentDayKey,
      accumSecToday: this.computeWorkTodaySec(),
      runningSince: this.globalRunStartMs,
    };
  }

  onEmitSegment(cb: (seg: EmittedSegment) => void) {
    this.segmentEmitter = cb;
  }

  // =============== API pública ===============
  enable(lawyerId: string, appVersion?: string) {
    this.state.lawyerId = lawyerId;
    this.state.appVersion = appVersion ?? null;
    if (!this.state.global.enabled) {
      this.state.global.enabled = true;
      this.pushState();
    }
    this.ensureTicker();
  }

  disable(opts?: { preserveDay?: boolean }) {
    const preserve = opts?.preserveDay ?? true;

    this.stopTicker();
    if (this.state.ctx.status === "running") {
      this.pause("close");
    }
    this.state.global = { enabled: false, status: "stopped" };
    this.state.ctx = { active: null, status: "stopped" };

    // siempre cortamos el “ancla viva”
    this.globalRunStartMs = null;

    if (preserve) {
      // mantené base y métricas del día
      this.state.metrics.ctxRunningSec = 0;
      // NO toques workTodayBaseSec
    } else {
      // reset duro (si alguna vez lo quisieras)
      this.workTodayBaseSec = 0;
      this.state.metrics = { workTodaySec: 0, ctxRunningSec: 0 };
      this.lastEmittedWorkSec = 0;
    }

    this.pushState();

    /*     this.workTodayBaseSec = 0;
    this.lastEmittedWorkSec = 0;
    this.state.metrics = { workTodaySec: 0, ctxRunningSec: 0 }; */
  }

  start(trackable: Trackable) {
    if (!this.state.global.enabled) return;

    // encender global si hacía falta
    if (this.state.global.status !== "running") {
      this.state.global.status = "running";
      if (this.globalRunStartMs == null) {
        this.globalRunStartMs = Date.now();
      }
      if (!this.state.global.startedAtUTC) {
        this.state.global.startedAtUTC = new Date().toISOString();
      }
    }

    // si había contexto corriendo, cerrarlo por “switch”
    if (this.state.ctx.status === "running" && this.state.ctx.startedAtUTC) {
      this.pause("switch");
    }

    // nuevo contexto
    this.state.ctx.active = trackable;
    this.state.ctx.status = "running";
    this.state.ctx.startedAtUTC = new Date().toISOString();
    this.state.ctx.lastPauseReason = undefined;
    this.state.metrics.ctxRunningSec = 0;

    this.ensureTicker();
    this.pushState();
  }

  pause(reason: PauseReason | "midnight-internal", effectiveEndMs?: number) {
    if (!this.state.global.enabled) return;

    const endMs = effectiveEndMs ?? Date.now();

    // cerrar contexto si estaba corriendo
    if (this.state.ctx.status === "running" && this.state.ctx.startedAtUTC) {
      const startedMs = Date.parse(this.state.ctx.startedAtUTC);
      const durationSec = Math.max(0, Math.round((endMs - startedMs) / 1000));

      if (
        durationSec >= MIN_SEGMENT_SEC &&
        this.state.ctx.active &&
        this.segmentEmitter
      ) {
        this.segmentEmitter({
          startMs: startedMs,
          endMs,
          seconds: durationSec,
          trackable: this.state.ctx.active,
          reason,
          dayKey: dayKeyLocal(new Date(startedMs)),
        });
      }

      this.state.ctx.status = reason === "close" ? "stopped" : "paused";
      this.state.ctx.startedAtUTC = undefined;
      this.state.ctx.lastPauseReason = reason;
      if (reason === "close") this.state.ctx.active = null;

      this.state.metrics.ctxRunningSec = 0;
    }

    // ⚠️ NO apagamos el global acá (tu UX lo decide con workPause si querés)
    this.pushState();
  }

  switchTo(trackable: Trackable | null) {
    if (trackable) {
      this.start(trackable);
    } else {
      if (this.state.ctx.status === "running") this.pause("switch");
      this.state.ctx.active = null;
      this.state.ctx.status = "stopped";
      this.pushState();
    }
  }

  workStart() {
    if (!this.state.global.enabled) return;
    if (!this.state.ctx.active) return;

    if (this.state.global.status !== "running") {
      this.state.global.status = "running";
      if (this.globalRunStartMs == null) {
        this.globalRunStartMs = Date.now();
        // ⬇️ Sembrá actividad inicial si no había
        if (this.lastActivityMs == null) {
          this.lastActivityMs = this.globalRunStartMs;
          this.state.global.lastActivityUTC = new Date(
            this.lastActivityMs
          ).toISOString();
        }
      }
      if (!this.state.global.startedAtUTC) {
        this.state.global.startedAtUTC = new Date().toISOString();
      }
      this.ensureTicker();
      this.pushState();
    }
  }

  workPause(effectiveEndMs?: number) {
    if (!this.state.global.enabled) return;

    const endMs = effectiveEndMs ?? Date.now();

    if (this.globalRunStartMs != null) {
      const runSec = Math.max(
        0,
        Math.floor((endMs - this.globalRunStartMs) / 1000)
      );
      this.workTodayBaseSec += runSec;
      this.globalRunStartMs = null;
    }

    this.state.global.status = "stopped";
    this.bumpAndPushIfNeeded();
  }

  markActivity() {
    const now = Date.now();
    this.lastActivityMs = now;
    this.state.global.lastActivityUTC = new Date(now).toISOString();

    if (!this.state.global.enabled) return;

    // ✅ Solo auto-resume si hay un contexto activo.
    //    (No prendas el global “a ciegas” en Login, post-logout, etc.)
    if (this.state.ctx.active && this.state.global.status !== "running") {
      this.start(this.state.ctx.active); // start() prende global y reabre el contexto
      return; // start() ya hace pushState internamente
    }

    // Si ya estaba corriendo, solo actualizaste lastActivity (lo correcto para el reloj de idle)
  }

  /* markActivity() {
    const now = Date.now();
    this.lastActivityMs = now;
    this.state.global.lastActivityUTC = new Date(now).toISOString();

    // 🔁 Auto-resume si estaba pausado por idle
    if (this.state.global.enabled && this.state.global.status !== "running") {
      // reencendé global
      this.state.global.status = "running";
      if (this.globalRunStartMs == null) this.globalRunStartMs = now;
      this.ensureTicker();

      // si había contexto pausado, relanzalo
      if (this.state.ctx.status === "paused" && this.state.ctx.active) {
        // start() reabre el mismo trackable correctamente
        this.start(this.state.ctx.active);
        return; // start() ya hace pushState
      }

      this.pushState();
    }
  } */

  // =============== Ticker ===============
  private ensureTicker() {
    if (this.ticker) return;
    // tick más corto y robusto; emitimos solo si cambia el entero
    this.ticker = setInterval(() => this.tick(), 250);
  }
  private stopTicker() {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = undefined;
  }

  private tick() {
    const now = new Date();
    const keyNow = dayKeyLocal(now);

    // 1) Cambio de día (igual que lo tenías)
    if (keyNow !== this.currentDayKey) {
      const midnightMs = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();

      if (
        this.state.ctx.status === "running" &&
        this.state.ctx.startedAtUTC &&
        this.state.ctx.active
      ) {
        this.pause("midnight-internal", midnightMs);
        this.start(this.state.ctx.active); // reanuda nuevo tramo
      }

      if (this.globalRunStartMs != null) {
        const runSec = Math.max(
          0,
          Math.floor((midnightMs - this.globalRunStartMs) / 1000)
        );
        this.workTodayBaseSec += runSec;
        this.globalRunStartMs = midnightMs;
      }

      this.currentDayKey = keyNow;
      this.workTodayBaseSec = 0;
      this.state.metrics.workTodaySec = 0;
      this.lastEmittedWorkSec = 0;

      if (this.state.global.status === "running") {
        this.state.global.startedAtUTC = new Date().toISOString();
      }

      // 👇 ojo: acá NO chequeamos idle; seguimos el flujo normal
      this.bumpAndPushIfNeeded();
      return;
    }

    // 2) ✅ Chequeo de IDLE en cada tick
    if (
      this.state.global.status === "running" &&
      this.lastActivityMs != null &&
      Date.now() - this.lastActivityMs >= IDLE_SEC * 1000
    ) {
      // 1) ms del ÚLTIMO segundo ya mostrado (alineado al tick de 1s)
      let displayEndMs = Date.now();
      if (this.globalRunStartMs != null) {
        const runSecShown = Math.max(
          0,
          Math.floor((Date.now() - this.globalRunStartMs) / 1000)
        );
        displayEndMs = this.globalRunStartMs + runSecShown * 1000;
      }

      // 2) ms máximo permitido por la regla de idle (no regalar tiempo)
      const idleCapMs = this.lastActivityMs + IDLE_SEC * 1000;

      // 3) elegimos el más conservador y realista
      const endMs = Math.min(displayEndMs, idleCapMs, Date.now());

      console.log("[IDLE] tick", {
        now: Date.now(),
        lastActivityMs: this.lastActivityMs,
        globalRunStartMs: this.globalRunStartMs,
        runSecShown:
          this.globalRunStartMs != null
            ? Math.floor((Date.now() - this.globalRunStartMs) / 1000)
            : -1,
        displayEndMs,
        idleCapMs,
        endMs,
      });

      if (this.state.ctx.status === "running") this.pause("idle", endMs);
      this.workPause(endMs);
      return;
    }

    // 3) Emitir solo si cambia el entero (como ya tenías)
    this.bumpAndPushIfNeeded();
  }

  private computeWorkTodaySec(): number {
    const live =
      this.globalRunStartMs != null && this.state.global.status === "running"
        ? Math.max(0, Math.floor((Date.now() - this.globalRunStartMs) / 1000))
        : 0;
    return this.workTodayBaseSec + live;
  }

  private bumpAndPushIfNeeded() {
    const sec = this.computeWorkTodaySec();

    // ctxRunningSec visible (si hay contexto corriendo)
    if (this.state.ctx.status === "running" && this.state.ctx.startedAtUTC) {
      const ctxMs = Date.now() - Date.parse(this.state.ctx.startedAtUTC);
      this.state.metrics.ctxRunningSec = Math.max(0, Math.floor(ctxMs / 1000));
    } else {
      this.state.metrics.ctxRunningSec = 0;
    }

    if (sec !== this.lastEmittedWorkSec) {
      this.lastEmittedWorkSec = sec;
      this.state.metrics.workTodaySec = sec;
      this.pushState();
    }
  }

  // =============== Emisión de estado ===============
  private pushState() {
    this.emit("state", this.getState());
  }

  getState(): TimerState {
    return JSON.parse(JSON.stringify(this.state));
  }

  onState(cb: (s: TimerState) => void) {
    this.on("state", cb);
    cb(this.getState());
    return () => this.off("state", cb);
  }

  toMirror(): Partial<{
    enabled: boolean;
    status: Extract<TimerStatus, "running" | "stopped">;
    runningSince?: number | null; // epoch ms
    accumSecToday: number; // entero, cambia +1s estrictamente
    active: { type: TrackableType; id: string } | null;
    contextStatus: TimerStatus;
    lastActivityAt: number;
  }> {
    const g = this.state.global;
    const c = this.state.ctx;
    return {
      enabled: g.enabled,
      status: g.status,
      runningSince: this.globalRunStartMs ?? null,
      accumSecToday: this.state.metrics.workTodaySec,
      active: c.active,
      contextStatus: c.status,
      lastActivityAt: g.lastActivityUTC
        ? Date.parse(g.lastActivityUTC)
        : Date.now(),
    };
  }

  getMeta() {
    return {
      lawyerId: this.state.lawyerId ?? "",
      appVersion: this.state.appVersion ?? undefined,
    };
  }
}
