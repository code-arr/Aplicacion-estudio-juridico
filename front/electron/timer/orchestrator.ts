// electron/timer/orchestrator.ts

import type { Trackable } from "./engine.js";

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
  | { type: "CONTEXT_SWITCH"; context: Trackable | null };

/**
 * Estado lógico de la jornada.
 * NO es estado del engine.
 */
type JourneyState = "idle" | "running" | "paused";

type OrchestratorState = {
  journey: JourneyState;
  lawyerId?: string;
  context: Trackable | null;
  dayKey: string;
};

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
 * 👉 Decide QUÉ hacer
 * 👉 NO mide tiempo
 * 👉 NO guarda segundos
 * 👉 NO habla con la UI
 *
 * En Fase 1:
 * - Solo guarda estado
 * - Loguea eventos
 * - NO toca ningún engine
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
  handle(event: TimerEvent) {
    // 🔍 Log temporal para debugging (se va a sacar después)
    console.log("[TIMER-ORCHESTRATOR]", event, {
      journey: this.state.journey,
      lawyerId: this.state.lawyerId,
      context: this.state.context,
      dayKey: this.state.dayKey,
    });

    switch (event.type) {
      case "LOGIN": {
        // cambio de día → arrancamos jornada nueva
        const today = todayKey();
        if (this.state.dayKey !== today) {
          this.state.dayKey = today;
          this.state.journey = "running";
          this.state.lawyerId = event.lawyerId;
          return;
        }

        // mismo día
        this.state.lawyerId = event.lawyerId;

        if (this.state.journey === "idle") {
          this.state.journey = "running"; // START
        } else if (this.state.journey === "paused") {
          this.state.journey = "running"; // RESUME
        }

        return;
      }

      case "LOGOUT": {
        if (this.state.journey === "running") {
          this.state.journey = "paused"; // PAUSE
        }
        return;
      }

      case "IDLE": {
        return;
      }

      case "ACTIVITY": {
        return;
      }

      case "DAY_CHANGE": {
        this.state.dayKey = todayKey();
        return;
      }

      case "CONTEXT_SWITCH": {
        this.state.context = event.context;
        return;
      }
    }
  }

  /**
   * Útil para tests y debugging
   */
  getState() {
    return { ...this.state };
  }
}
