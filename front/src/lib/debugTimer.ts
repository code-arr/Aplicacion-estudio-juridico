// src/lib/debugTimer.ts
export const DEBUG_TIMERS = true; // o léelo de import.meta.env
export function tlog(...args: any[]) {
  if (DEBUG_TIMERS) console.log("[timer]", ...args);
}
