/* import { startOfNextDayMs } from "@/utils/tz";

export const clock = {
  nowSystem(): number {
    return Date.now();
  },
  nowMono(): number {
    // En renderer existe performance.now(); en Node 18+ también.
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  },
  toUTCISOString(ms: number): string {
    return new Date(ms).toISOString();
  },
  nextMidnightMs(tz: string, fromMs?: number): number {
    return startOfNextDayMs(tz, fromMs);
  },
}; */
