export type TrackableType =
  | "Lawyer"
  | "LawyerApp"
  | "Client"
  | "ClientItem"
  | "Document"
  | "Audience"
  | "Meeting"
  | "Process";

export type TimerStatus = "running" | "paused" | "stopped";

export type PauseReason = "idle" | "switch" | "close" | "logout" | "manual";

export type Trackable = { type: TrackableType; id: string };
