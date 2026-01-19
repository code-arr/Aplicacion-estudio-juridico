// electron/timer/ipc.ts
import { BrowserWindow, ipcMain } from "electron";
import { randomUUID } from "crypto";
import { powerMonitor } from "electron";
import { TimerEngine, Trackable } from "./engine.js";
import { TimerDecision, TimerOrchestrator } from "./orchestrator.js";
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
export const IDLE_LIMIT_MS = 30 * 60 * 1000;
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

const orchestrator = new TimerOrchestrator();

function applyDecisions(decisions: TimerDecision[]) {
  for (const d of decisions) {
    switch (d.type) {
      case "ENGINE_ENABLE": {
        const e = ensure();

        if (e.getMeta().lawyerId === d.lawyerId && e.toMirror().ready) {
          break; // ya está habilitado
        }

        // 1) habilitar engine con lawyerId
        e.enable(d.lawyerId);

        // 2) leer snapshot persistido de ESTE abogado
        const savedSnap = globalTimerStore.read(d.lawyerId);
        console.log("[TIMER SNAP READ]", {
          lawyerId: d.lawyerId,
          savedSnap,
        });

        // 3) restaurar base diaria (o resetear si es otro día)
        e.seedDailyBase(savedSnap);

        // 4) marcar engine como listo (gate para el renderer)
        e.setReady(true);

        break;
      }

      case "ENGINE_WORK_START":
        ensure().workStart();
        break;

      case "ENGINE_WORK_PAUSE":
        ensure().workPause();
        break;

      case "ENGINE_ALIGNED_STOP":
        alignedStop(d.reason);
        break;

      case "NO_OP":
        break;
    }
  }
}

// ---------------------------------------------------------
// Persistencia + broadcast del mirror a todos los windows
const wireState = () => {
  ensure().removeAllListeners("state");
  ensure().on("state", () => {
    // 💡 Obtenemos el ID actual del motor para guardar en SU casillero
    const currentLawyerId = ensure().getMeta().lawyerId;

    if (currentLawyerId) {
      try {
        const snap = ensure().getDailySnapshot();

        // ⛔ no pisar un día ya iniciado con 0
        if (snap.accumSecToday > 0) {
          globalTimerStore.write(currentLawyerId, snap);
        }
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

// ---------------------------------------------------------
// Export para usar en main.ts (before-quit)
export function timerShutdown() {
  const decisions = orchestrator.handle({ type: "APP_CLOSE" });
  applyDecisions(decisions);
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
        const decisions = orchestrator.handle({ type: "IDLE" });
        applyDecisions(decisions);
      }
    }, 3000);
  };
}
const startIdleLoop = ensureIdleLoop();

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

  // ================== APP VISIBILITY → TIMER CONTROL ==================
  /*   ipcMain.on("presence:event", (_e, ev: string) => {
    const engineInstance = ensure();
    const state = engineInstance.getState();

    // 🔻 Todas las ventanas no visibles
    if (ev === "app:minimized-all") {
      if (state.global.status === "running") {
        // 🍎 macOS: cerrar ventana (❌) debe registrarse como CLOSE
        if (process.platform === "darwin") {
          console.log(
            "[TIMER] App window closed (macOS) → stopping timer (close)"
          );
          timerShutdown();
        } else {
          // 🪟 Windows / Linux: comportamiento actual
          console.log("[TIMER] App minimized → stopping timer (switch)");
          const decisions = orchestrator.handle({ type: "APP_MINIMIZED" });
          applyDecisions(decisions);
        }
      }
      return;
    }

    // 🔺 Alguna ventana volvió a estar visible → reanudar tiempo
    if (ev === "app:restored-any") {
      console.log("[TIMER] App restored → delegating to orchestrator");
      const decisions = orchestrator.handle({ type: "APP_RESTORED" });
      applyDecisions(decisions);
      return;
    }
  }); */

  ipcMain.on("presence:event", (_e, ev: string) => {
    const orchState = orchestrator.getState();

    if (ev === "app:minimized-all") {
      if (orchState.journey !== "running") return;

      if (process.platform === "darwin") {
        const decisions = orchestrator.handle({ type: "APP_CLOSE" });
        applyDecisions(decisions);
      } else {
        const decisions = orchestrator.handle({ type: "APP_MINIMIZED" });
        applyDecisions(decisions);
      }
      return;
    }

    if (ev === "app:restored-any") {
      if (orchState.journey !== "paused") return;

      const decisions = orchestrator.handle({ type: "ACTIVITY" });
      applyDecisions(decisions);
      return;
    }
  });

  // 🆕 Eventos del SO (se instalan una sola vez)
  powerMonitor.on("suspend", () => {
    const decisions = orchestrator.handle({ type: "APP_CLOSE" });
    applyDecisions(decisions);
  });
  powerMonitor.on("lock-screen", () => {
    const decisions = orchestrator.handle({ type: "APP_CLOSE" });
    applyDecisions(decisions);
  }); // tratamos lock como suspend
  powerMonitor.on("shutdown", () => timerShutdown()); // Windows: avisa antes que before-quit

  // --- Rutas IPC (todas con handleOnce) ---
  handleOnce("timer:getMirror", () => ensure().toMirror());

  handleOnce(
    "timer:enable",
    (_e, p: { lawyerId: string; appVersion?: string }) => {
      const decisions = orchestrator.handle({
        type: "LOGIN",
        lawyerId: p.lawyerId,
      });
      applyDecisions(decisions);
      return { ok: true };
    }
  );

  handleOnce("timer:disable", () => {
    const decisions = orchestrator.handle({ type: "LOGOUT" });
    applyDecisions(decisions);
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
}
