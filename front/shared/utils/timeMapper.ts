// /shared/utils/timer-mappers.ts
import { Trackable, PauseReason } from "../types/TimerBase.js";
import { ActiveSession } from "../types/TimerStore.js";
import { StartDTO, PauseDTO } from "../types/TimerDto.js";

// 1) Crear el payload de START (y una nueva sesión local)
export function toStartDTO(trackable: Trackable): {
  dto: StartDTO;
  session: ActiveSession;
} {
  const localSessionId = crypto.randomUUID();
  const startedAt = Date.now();

  return {
    dto: {
      eventId: crypto.randomUUID(),
      localSessionId,
      trackable,
      startedAt,
    },
    session: {
      localSessionId,
      trackable,
      startedAt,
      status: "running",
      lastActivityAt: startedAt,
    },
  };
}

// 2) Crear el payload de PAUSE desde la sesión activa
export function toPauseDTO(
  active: ActiveSession,
  reason: PauseReason
): PauseDTO {
  return {
    eventId: crypto.randomUUID(),
    localSessionId: active.localSessionId,
    serverSessionId: active.serverSessionId, // puede ser undefined si aún no llegó
    pausedAt: Date.now(),
    reason,
  };
}

// 3) Aplicar el ack del backend del START (guardar serverSessionId)
export function applyStartAck(
  active: ActiveSession,
  serverSessionId: string
): ActiveSession {
  return { ...active, serverSessionId };
}
