import axios from "./axios";
import type { PauseReason, StartOpts } from "@/store/useTimerStore";
import type { Trackable, TimeEntry } from "@/types/Timer";

export const startTimer = async (trackable: Trackable, opts?: StartOpts) => {
  const body = {
    lawyerId: opts?.lawyerId, // opcional
    source: opts?.source ?? "auto",
    clientTime: new Date().toISOString(), // UTC ISO
  };
  const res = await axios.post(
    `/timers/${trackable.type}/${trackable.id}/start`,
    body,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  if (res.status < 200 || res.status >= 300)
    throw new Error("Failed to start timer");
  return res.data as { timerStateId: string; timeEntryId: string };
};

export const pauseTimer = async (trackable: Trackable, reason: PauseReason) => {
  const body = {
    reason,
    clientTime: new Date().toISOString(), // UTC ISO
  };
  const res = await axios.post(
    `/timers/${trackable.type}/${trackable.id}/pause`,
    body,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  if (res.status < 200 || res.status >= 300)
    throw new Error("Failed to pause timer");
  return res.data as { closedEntryId: string; durationSec: number };
};

export async function createManualTimeEntry(timeEntry: TimeEntry) {
  const res = await fetch("/time-entries/manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(timeEntry),
  });
  if (!res.ok) throw new Error("No se pudo registrar el tiempo");
  return res.json();
}
