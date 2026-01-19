// electron/timer/orchestrator.ts

import type { Trackable } from "./engine.js";

export type TimerDecision =
  | { type: "ENGINE_ENABLE"; lawyerId: string }
  | { type: "ENGINE_WORK_START" }
  | { type: "ENGINE_WORK_PAUSE" }
  | {
      type: "ENGINE_ALIGNED_STOP";
      reason: "idle" | "logout" | "close" | "switch";
    }
  | { type: "NO_OP" };

/**
 * Eventos semánticos que recibe el orquestador.
 * NO son acciones directas sobre los timers.
 */
export type TimerEvent =
  | { type: "LOGIN"; lawyerId: string }
  | { type: "LOGOUT" }
  | { type: "IDLE" }
  | { type: "ACTIVITY" }
  | { type: "DAY_CHANGE" }
  | { type: "CONTEXT_SWITCH"; context: Trackable | null }
  | { type: "APP_CLOSE" }
  | { type: "APP_MINIMIZED" }
  | { type: "APP_RESTORED" };

/**
 * Estado lógico de la jornada.
 * NO es estado del engine ni segundos.
 */
type JourneyState = "idle" | "running" | "paused";

type OrchestratorState = {
  journey: JourneyState;
  lawyerId?: string;
  context: Trackable | null;
  dayKey: string;
};

// YYYY-MM-DD local
function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

/**
 * Orquestador central de timers.
 *
 * 👉 Decide ESTADOS
 * 👉 NO ejecuta acciones
 * 👉 NO mide tiempo
 * 👉 NO habla con el engine
 *
 * En Fase 1:
 * - Máquina de estados pura
 * - Logs explícitos
 */
export class TimerOrchestrator {
  private state: OrchestratorState;

  constructor() {
    this.state = {
      journey: "idle",
      lawyerId: undefined,
      context: null,
      dayKey: todayKey(),
    };
  }

  /**
   * Punto ÚNICO de entrada.
   * Todas las decisiones pasan por acá.
   */
  handle(event: TimerEvent): TimerDecision[] {
    console.log("[TIMER-ORCHESTRATOR]", event, { ...this.state });

    switch (event.type) {
      case "LOGIN": {
        const today = todayKey();

        if (this.state.dayKey !== today) {
          this.state.dayKey = today;
          this.state.journey = "running";
          this.state.lawyerId = event.lawyerId;

          return [
            { type: "ENGINE_ENABLE", lawyerId: event.lawyerId },
            { type: "ENGINE_WORK_START" },
          ];
        }

        this.state.lawyerId = event.lawyerId;

        if (this.state.journey !== "running") {
          this.state.journey = "running";
          return [
            { type: "ENGINE_ENABLE", lawyerId: event.lawyerId },
            { type: "ENGINE_WORK_START" },
          ];
        }

        return [{ type: "NO_OP" }];
      }

      case "LOGOUT": {
        if (this.state.journey === "running") {
          this.state.journey = "paused";
          return [{ type: "ENGINE_ALIGNED_STOP", reason: "logout" }];
        }
        return [{ type: "NO_OP" }];
      }

      case "IDLE": {
        if (this.state.journey === "running") {
          this.state.journey = "paused";
          return [{ type: "ENGINE_ALIGNED_STOP", reason: "idle" }];
        }
        return [{ type: "NO_OP" }];
      }

      case "ACTIVITY": {
        if (this.state.journey === "paused") {
          this.state.journey = "running";
          return [{ type: "ENGINE_WORK_START" }];
        }
        return [{ type: "NO_OP" }];
      }

      case "DAY_CHANGE": {
        this.state.dayKey = todayKey();
        this.state.journey = "idle";
        this.state.context = null;
        return [{ type: "ENGINE_ALIGNED_STOP", reason: "close" }];
      }

      case "CONTEXT_SWITCH": {
        this.state.context = event.context;
        return [{ type: "NO_OP" }];
      }

      case "APP_CLOSE": {
        // Si la jornada estaba activa, la cerramos de forma alineada
        if (this.state.journey === "running") {
          this.state.journey = "paused";
          return [{ type: "ENGINE_ALIGNED_STOP", reason: "close" }];
        }

        // Si ya estaba pausada o idle, no hacemos nada
        return [{ type: "NO_OP" }];
      }

      case "APP_MINIMIZED": {
        if (this.state.journey === "running") {
          this.state.journey = "paused";
          return [{ type: "ENGINE_ALIGNED_STOP", reason: "switch" }];
        }
        return [{ type: "NO_OP" }];
      }

      case "APP_RESTORED": {
        if (this.state.journey === "paused") {
          this.state.journey = "running";
          return [{ type: "ENGINE_WORK_START" }];
        }
        return [{ type: "NO_OP" }];
      }
    }
  }

  /**
   * Útil para tests y debugging
   */
  getState(): OrchestratorState {
    return { ...this.state };
  }
}
