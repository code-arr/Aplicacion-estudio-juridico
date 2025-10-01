import { StartDTO, PauseDTO } from "./TimerDto.js";
import { Trackable, TimerStatus } from "./TimerBase.js";

export type TimerEventLocal =
  | { kind: "START"; dto: StartDTO }
  | { kind: "PAUSE"; dto: PauseDTO };

export type ActiveSession = {
  localSessionId: string;
  serverSessionId?: string;
  trackable: Trackable;
  startedAt: number;
  status: Extract<TimerStatus, "running" | "paused">;
  lastActivityAt: number;
};

export type PersistedTimerState = {
  active?: ActiveSession;
  pending: TimerEventLocal[];
  meta?: {
    lastFlushAt?: number;
    retryBackoffMs?: number;
    schemaVersion?: number;
  };
};
