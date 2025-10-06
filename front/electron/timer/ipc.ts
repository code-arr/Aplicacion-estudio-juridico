// electron/timer/ipc.ts
import { BrowserWindow, ipcMain } from "electron";
import { randomUUID } from "crypto";
import { powerMonitor } from "electron";
import { TimerEngine, Trackable } from "./engine.js";
import { timeQueueStore } from "../store/timeQueueStore.js";
import { globalTimerStore } from "../store/globalTimerStore.js";
import type { TimeEntry, PauseReason } from "../../src/types/Timer.js";

const IDLE_LIMIT_MS = 90_000 as const;

let engine: TimerEngine | null = null;
let wired = false;

const IDLE_SEC = Math.floor(IDLE_LIMIT_MS / 1000);
let _idleLoop: NodeJS.Timeout | null = null;

/* export function timerShutdown() {
  if (!engine) return;
  try {
    // Alinear al último segundo ya mostrado
    const mirror = engine.toMirror();
    let displayEndMs = Date.now();
    if (mirror.runningSince != null) {
      const runSecShown = Math.max(
        0,
        Math.floor((Date.now() - mirror.runningSince) / 1000)
      );
      displayEndMs = mirror.runningSince + runSecShown * 1000;
    }
    const eff = Math.min(displayEndMs, Date.now());

    // 1) cerrar contexto (emite segmento)
    engine.pause("close", eff);
    // 2) detener global en el mismo instante
    engine.workPause(eff);

    // 3) persistir snapshot
    globalTimerStore.write(engine.getDailySnapshot());
  } catch (e) {
    console.error("[timerShutdown]", e);
  }
} */

// ---------- bootstrap del motor ----------
const ensure = () => {
  if (!engine) {
    engine = new TimerEngine();
    // Sembrar con lo último guardado (si es del mismo día)
    try {
      engine.seedDailyBase(globalTimerStore.read());
    } catch (e) {
      console.error("[globalTimerStore.read] failed:", e);
    }
  }
  return engine!;
};

// ---------- estado → persistencia y broadcast ----------
const wireState = () => {
  ensure().removeAllListeners("state");
  ensure().on("state", () => {
    // Guardar snapshot en disco en cada cambio (1/s típico)
    try {
      globalTimerStore.write(ensure().getDailySnapshot());
    } catch (e) {
      console.error("[globalTimerStore.write] failed:", e);
    }
    const mirror = ensure().toMirror();
    BrowserWindow.getAllWindows().forEach((win) => {
      try {
        win.webContents.send("timer:state", mirror);
      } catch {}
    });
  });
};

// ---------- helper: stop alineado y persistente (DRY) ----------
function alignedStop(reason: PauseReason | "suspend" | "close") {
  const m = ensure().toMirror();

  // 1) fin alineado al último segundo ya mostrado
  let displayEndMs = Date.now();
  if (m.runningSince != null) {
    const runSecShown = Math.max(
      0,
      Math.floor((Date.now() - m.runningSince) / 1000)
    );
    displayEndMs = m.runningSince + runSecShown * 1000;
  }
  const eff = Math.min(displayEndMs, Date.now());

  // 2) cerrá contexto y global (idempotente si ya estaban parados)
  const st = ensure().getState();
  if (st.ctx.status === "running") ensure().pause(reason, eff); // razón “close” o la que pases
  if (st.global.status === "running") ensure().workPause(eff);

  // 3) snapshot
  try {
    globalTimerStore.write(ensure().getDailySnapshot());
  } catch {}
}

// ---------- export: para usar en main.ts / before-quit ----------
export function timerShutdown() {
  // Se usa como “último seguro” cuando la app está por cerrar.
  alignedStop("close");
}

// ---------- idle por SO (fallback) ----------
function ensureIdleLoop() {
  if (_idleLoop) return;
  _idleLoop = setInterval(() => {
    const st = ensure().getState();
    if (st.global.status !== "running") return;

    const idle = powerMonitor.getSystemIdleTime?.() ?? 0;
    if (idle >= IDLE_SEC) {
      // Reutilizamos la lógica centralizada (alineado + pausa ctx + pausa global + snapshot)
      alignedStop("idle");
    }
  }, 3000);
}

// ---------- idle por SO (fallback) ----------
/* function ensureIdleLoop() {
  if (_idleLoop) return;
  _idleLoop = setInterval(() => {
    const st = ensure().getState();
    if (st.global.status !== "running") return;

    const idle = powerMonitor.getSystemIdleTime?.() ?? 0;
    if (idle >= IDLE_SEC) {
      const lastFromEngine = st.global.lastActivityUTC
        ? Date.parse(st.global.lastActivityUTC)
        : 0;
      const lastFromOS = Date.now() - idle * 1000;

      // dentro del ensureIdleLoop, después de calcular lastFromEngine / lastFromOS
      const lastInput = Math.max(lastFromEngine, lastFromOS);
      const idleCapMs = lastInput + IDLE_SEC * 1000;

      // endMs alineado al último segundo mostrado (sin helper del engine):
      const mirror = ensure().toMirror();
      let displayEndMs = Date.now();
      if (mirror.runningSince != null) {
        const runSecShown = Math.max(
          0,
          Math.floor((Date.now() - mirror.runningSince) / 1000)
        );
        displayEndMs = mirror.runningSince + runSecShown * 1000;
      }

      const eff = Math.min(displayEndMs, idleCapMs, Date.now());
      ensure().pause("idle", eff);
      ensure().workPause(eff);
    }
  }, 3000);
} */

// ---------- Disparadores: eventos del SO: suspend / lock / shutdown ----------
powerMonitor.on("suspend", () => alignedStop("suspend"));
powerMonitor.on("lock-screen", () => alignedStop("suspend")); // tratamos lock como suspend
powerMonitor.on("shutdown", () => alignedStop("close")); // Windows: avisa antes que before-quit

// ---------- segmentos → cola local ----------
ensure().onEmitSegment((seg) => {
  const meta = ensure().getMeta();
  const entry: TimeEntry = {
    id: randomUUID(),
    trackableType: seg.trackable.type,
    trackableId: seg.trackable.id,
    lawyerId: meta.lawyerId,
    startedAtUTC: new Date(seg.startMs).toISOString(),
    endedAtUTC: new Date(seg.endMs).toISOString(),
    durationSec: seg.seconds,
    pauseReason: seg.reason === "midnight-internal" ? "switch" : seg.reason,
    appVersion: meta.appVersion,
  };

  // 👇 pretty log en la consola del proceso main (tu terminal)
  const hms = (s: number) => {
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
      2,
      "0"
    )}:${String(ss).padStart(2, "0")}`;
  };

  console.log(
    "[TIME-ENTRY]",
    `${entry.pauseReason?.toUpperCase()} | ${entry.trackableType}:${
      entry.trackableId
    } | ${hms(entry.durationSec)} |`,
    `${entry.startedAtUTC} → ${entry.endedAtUTC}`
  );

  try {
    timeQueueStore.append(entry);
  } catch (e) {
    console.error("[timeQueueStore.append] failed:", e);
  }

  // 👇 (opcional) reenviar a todos los renderers para verlo en DevTools
  BrowserWindow.getAllWindows().forEach((win) => {
    try {
      win.webContents.send("dev:time-entry", entry);
    } catch {}
  });
});

// ---------- IPC público ----------
export function registerTimerIpc() {
  if (wired) return;
  wired = true;

  // snapshot inmediato para el primer bind
  ipcMain.handle("timer:getMirror", () => ensure().toMirror());

  ipcMain.handle(
    "timer:enable",
    (_e, p: { lawyerId: string; appVersion?: string }) => {
      ensure().enable(p.lawyerId, p.appVersion);
      wireState();
      return { ok: true };
    }
  );
  ipcMain.handle("timer:disable", () => {
    ensure().disable();
    return { ok: true };
  });

  ipcMain.handle("timer:start", (_e, t: Trackable) => {
    ensure().start(t);
    return { ok: true };
  });

  // Recibe objeto { reason, effectiveEndMs? }
  ipcMain.handle(
    "timer:pause",
    (_e, p: { reason: PauseReason; effectiveEndMs?: number }) => {
      ensure().pause(p?.reason, p?.effectiveEndMs);
      return { ok: true };
    }
  );

  ipcMain.handle("timer:switchTo", (_e, t: Trackable | null) => {
    ensure().switchTo(t);
    return { ok: true };
  });

  ipcMain.handle("timer:workStart", () => {
    ensure().workStart();
    return { ok: true };
  });
  ipcMain.handle("timer:workPause", (_e, effectiveEndMs?: number) => {
    ensure().workPause(effectiveEndMs);
    return { ok: true };
  });

  ipcMain.on("timer:activity", () => ensure().markActivity());

  /*   ipcMain.handle("timer:shutdown", () => {
    ensure().workPause(); // 👈 consolidar y dejar detenido
    // (opcional) forzar un último write del snapshot:
    try {
      globalTimerStore.write(ensure().getDailySnapshot());
    } catch {}
    return { ok: true };
  }); */

  ensureIdleLoop();
}
