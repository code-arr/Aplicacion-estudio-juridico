import { Trackable, PauseReason } from "./TimerBase.js";

export type StartDTO = {
  eventId: string; // uuid
  localSessionId: string; // uuid
  trackable: Trackable;
  startedAt: number; // epoch ms (o ISO si preferís)
};

export type PauseDTO = {
  eventId: string;
  localSessionId: string;
  serverSessionId?: string; // llega al confirmar start
  pausedAt: number; // epoch ms
  reason: PauseReason;
};
