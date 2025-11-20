// electron/timer/ipc.ts
import { BrowserWindow, ipcMain } from "electron";
import { randomUUID } from "crypto";
import { powerMonitor } from "electron";
import { TimerEngine, Trackable } from "./engine.js";
import { timeQueueStore } from "../store/timeQueueStore.js";
import { globalTimerStore } from "../store/globalTimerStore.js";
import type { TimeEntry, PauseReason } from "../../src/types/Timer.js";

// ---------------------------------------------------------
// 🆕 Flag global para no cablear dos veces (dev/HMR, ventanas extra, etc.)
const GLOBAL_FLAG = "__timer_ipc_wired__";

// Estado interno del módulo
let engine: TimerEngine | null = null;

// ---------------------------------------------------------
// 🆕 Mantener la constante acá (evita import cycles con el front)
const IDLE_LIMIT_MS = 90_000 as const;
const IDLE_SEC = Math.floor(IDLE_LIMIT_MS / 1000);

// ---------------------------------------------------------
// Bootstrap del motor
const ensure = (): TimerEngine => {
  if (!engine) {
    engine = new TimerEngine();
    // ❌ ANTES: engine.seedDailyBase(globalTimerStore.read());
    // ✅ AHORA: No hacemos seed aquí porque no tenemos lawyerId todavía.
    // El seed se hará en el 'timer:enable'.
  }
  return engine!;
};

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

// ---------------------------------------------------------
// Persistencia + broadcast del mirror a todos los windows
const wireState = () => {
  ensure().removeAllListeners("state");
  ensure().on("state", () => {
    // 💡 Obtenemos el ID actual del motor para guardar en SU casillero
    const currentLawyerId = ensure().getMeta().lawyerId;

    if (currentLawyerId) {
      try {
        globalTimerStore.write(currentLawyerId, ensure().getDailySnapshot());
      } catch (e) {
        console.error("[globalTimerStore.write] failed:", e);
      }
    }

    // Broadcast a las ventanas (igual que antes)
    const mirror = ensure().toMirror();
    BrowserWindow.getAllWindows().forEach((win) => {
      try {
        win.webContents.send("timer:state", mirror);
      } catch {}
    });
  });
};

// ---------------------------------------------------------
// Helpers de tiempo
function alignedStop(reason: PauseReason | "suspend" | "close" | "idle") {
  const now = Date.now();

  // 1) ms del ÚLTIMO segundo ya mostrado (alineado a lo que vio el usuario)
  const m = ensure().toMirror();
  let displayEndMs = now;
  if (m.runningSince != null) {
    const runSecShown = Math.max(0, Math.floor((now - m.runningSince) / 1000));
    displayEndMs = m.runningSince + runSecShown * 1000;
  }

  // 2) Si es IDLE, calculamos el "cap" para NO regalar tiempo
  let idleCapMs = Number.POSITIVE_INFINITY;
  if (reason === "idle") {
    const st = ensure().getState();
    const lastFromEngine = st.global.lastActivityUTC
      ? Date.parse(st.global.lastActivityUTC)
      : 0;
    const idleSec = powerMonitor.getSystemIdleTime?.() ?? 0; // redondeado por SO
    const lastFromOS = now - idleSec * 1000;
    const lastInput = Math.max(lastFromEngine, lastFromOS);
    idleCapMs = lastInput + IDLE_LIMIT_MS;
  }

  // 3) Elegimos el fin efectivo más conservador y realista
  const eff = Math.min(displayEndMs, idleCapMs, now);

  // 4) Cerrar contexto y global (idempotente si ya estaban parados)
  const st2 = ensure().getState();
  if (st2.ctx.status === "running") ensure().pause(reason, eff);
  if (st2.global.status === "running") ensure().workPause(eff);

  // 5) Snapshot
  try {
    const currentId = ensure().getMeta().lawyerId; // 💡 Buscamos el ID
    if (currentId) {
      globalTimerStore.write(currentId, ensure().getDailySnapshot());
    }
  } catch (e) {
    console.error("[globalTimerStore.write] failed:", e);
  }
}
/* function alignedStop(reason: PauseReason | "suspend" | "close") {
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
  } catch {
    console.error("[globalTimerStore.write] failed:");
  }
} */

// ---------------------------------------------------------
// Export para usar en main.ts (before-quit)
export function timerShutdown() {
  alignedStop("close");
}

// ---------------------------------------------------------
// 🆕 Idle por SO (fallback) con “constructor” que devuelve starter idempotente
function ensureIdleLoop() {
  let idleLoop: NodeJS.Timeout | null = null;
  return () => {
    if (idleLoop) return; // ya corriendo
    idleLoop = setInterval(() => {
      const st = ensure().getState();
      if (st.global.status !== "running") return;

      const idle = powerMonitor.getSystemIdleTime?.() ?? 0;
      if (idle >= IDLE_SEC) {
        // 🆕 usa alignedStop("idle") → evita regalar segundos
        alignedStop("idle");
      }
    }, 3000);
  };
}
const startIdleLoop = ensureIdleLoop();

/* ensure().onEmitSegment((seg) => {
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
}); */

// ---------------------------------------------------------
// Pretty log para segmentos
function hms(s: number) {
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
    2,
    "0"
  )}:${String(ss).padStart(2, "0")}`;
}

// 🆕 Conectar segmentos → cola + log + rebroadcast a renderers (dev)
function wireSegments() {
  const e = ensure();
  e.onEmitSegment((seg) => {
    const meta = e.getMeta();

    // Lógica inteligente: Si viene clientId usalo, SINO si es tipo Client, usá el ID del trackable
    const finalClientId =
      seg.trackable.clientId ??
      (seg.trackable.type === "Client" ? seg.trackable.id : undefined);

    const entry: TimeEntry = {
      id: randomUUID(),
      trackableType: seg.trackable.type,
      trackableId: seg.trackable.id,

      // Usamos la variable calculada
      clientId: finalClientId,

      clientItemId: seg.trackable.clientItemId,
      lawyerId: meta.lawyerId,
      dayKey: seg.dayKey,
      startedAtUTC: new Date(seg.startMs).toISOString(),
      endedAtUTC: new Date(seg.endMs).toISOString(),
      durationSec: seg.seconds,
      pauseReason: seg.reason === "midnight-internal" ? "switch" : seg.reason,
      appVersion: meta.appVersion,
    };

    console.log(
      "[TIME-ENTRY]",
      `${entry.pauseReason?.toUpperCase()} | ${entry.trackableType}:${
        entry.trackableId
      } | ${hms(entry.durationSec)} |`,
      `${entry.startedAtUTC} → ${entry.endedAtUTC}`,
      `ClientID: ${entry.clientId}`,
      `ClientItemID: ${entry.clientItemId}`
    );

    try {
      timeQueueStore.append(entry);
    } catch (err) {
      console.error("[timeQueueStore.append] failed:", err);
    }

    // 🆕 Útil para ver los entries también en DevTools (renderer)
    BrowserWindow.getAllWindows().forEach((win) => {
      try {
        win.webContents.send("dev:time-entry", entry);
      } catch {}
    });
  });
}

// ---------------------------------------------------------
// 🆕 Handler idempotente: borra cualquier handler anterior antes de registrar
function handleOnce<T extends (...args: any[]) => any>(channel: string, fn: T) {
  try {
    ipcMain.removeHandler(channel);
  } catch {}
  ipcMain.handle(channel, fn);
}

// ---------------------------------------------------------
// Registro público de IPC (llamar UNA sola vez por proceso)
export function registerTimerIpc() {
  const g = globalThis as any;
  if (g[GLOBAL_FLAG]) return; // ya cableado en este proceso
  g[GLOBAL_FLAG] = true;

  // 🆕 Cableo base
  wireState();
  wireSegments();
  startIdleLoop();

  // 🆕 Eventos del SO (se instalan una sola vez)
  powerMonitor.on("suspend", () => alignedStop("suspend"));
  powerMonitor.on("lock-screen", () => alignedStop("suspend")); // tratamos lock como suspend
  powerMonitor.on("shutdown", () => alignedStop("close")); // Windows: avisa antes que before-quit

  // --- Rutas IPC (todas con handleOnce) ---
  handleOnce("timer:getMirror", () => ensure().toMirror());

  handleOnce(
    "timer:enable",
    (_e, p: { lawyerId: string; appVersion?: string }) => {
      const engineInstance = ensure();
      const oldId = engineInstance.getMeta().lawyerId;

      // Si ya había alguien logueado y es distinto al nuevo...
      if (oldId && oldId !== p.lawyerId) {
        // Guardamos el estado del anterior por las dudas (safety save)
        globalTimerStore.write(oldId, engineInstance.getDailySnapshot());
      }

      // 1. Habilitamos al nuevo (esto setea el lawyerId interno en el engine)
      engineInstance.enable(p.lawyerId, p.appVersion);

      // 2. Leemos el snapshot guardado de ESTE abogado
      const savedSnap = globalTimerStore.read(p.lawyerId);

      // 3. Reseteamos/Restauramos el engine con esos datos
      // (seedDailyBase ya se encarga de poner en 0 si es otro día o restaurar si es hoy)
      engineInstance.seedDailyBase(savedSnap);

      // Forzamos un emit del estado nuevo para que el front se entere rápido
      // (Aunque seedDailyBase no emite, el engine suele emitir en el proximo tick,
      // pero podés forzarlo si tenés un método pushState público o tocando algo).

      return { ok: true };
    }
  );

  // 🆕 acepta opts si alguna vez querés reset duro (preserveDay=false)
  handleOnce("timer:disable", (_e, opts?: { preserveDay?: boolean }) => {
    ensure().disable(opts);
    return { ok: true };
  });

  handleOnce("timer:start", (_e, t: Trackable) => {
    ensure().start(t);
    return { ok: true };
  });

  handleOnce(
    "timer:pause",
    (_e, p: { reason: PauseReason; effectiveEndMs?: number }) => {
      ensure().pause(p?.reason, p?.effectiveEndMs);
      return { ok: true };
    }
  );

  handleOnce("timer:switchTo", (_e, t: Trackable | null) => {
    ensure().switchTo(t);
    return { ok: true };
  });

  handleOnce("timer:workStart", () => {
    ensure().workStart();
    return { ok: true };
  });

  handleOnce("timer:workPause", (_e, effectiveEndMs?: number) => {
    ensure().workPause(effectiveEndMs);
    return { ok: true };
  });

  // 🆕 sigue siendo un “fire-and-forget” (no hay race si llega tarde)
  ipcMain.on("timer:activity", () => ensure().markActivity());

  // 🆕 API utilitaria para pedir una detención alineada explícita
  handleOnce("timer:alignedStop", (_e, reason: PauseReason) => {
    alignedStop(reason);
    return { ok: true };
  });
}
