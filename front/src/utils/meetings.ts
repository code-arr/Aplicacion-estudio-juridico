// src/utils/meetings.ts
import type { Meeting } from "@/types/Meeting";

export function pickNextAndLast(meetings: Meeting[]) {
  const valid = meetings.filter((m) => m.status !== "canceled");

  const now = Date.now();
  const future = valid
    .filter((m) => new Date(m.startAt).getTime() >= now)
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

  const past = valid
    .filter((m) => new Date(m.startAt).getTime() < now)
    .sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );

  return {
    nextUpcoming: future[0] ?? null,
    lastMeeting: past[0] ?? null,
  };
}
