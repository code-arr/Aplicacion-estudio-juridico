import type { TimerEvent } from "@/types/Timer";

// Detecto si estoy en Electron (preload expuso electronAPI)
type ElectronTB = {
  append: (ev: TimerEvent) => Promise<number | void>;
  getPending: () => Promise<TimerEvent[]>;
  setPending: (evs: TimerEvent[]) => Promise<number | void>;
  clear: () => Promise<number | void>;
  count: () => Promise<number>;
};

const electronTB: ElectronTB | undefined =
  (typeof window !== "undefined" && window.electronAPI?.timeBuffer) ||
  undefined;

const webPending: TimerEvent[] = [];
let flushing = false;

export const timeBuffer = {
  append: async (ev: TimerEvent) => {
    if (electronTB) return window.electronAPI.timeBuffer.append(ev);
    webPending.push(ev);
  },
  flush: async (opts?: { maxRequests?: number }) => {
    const maxRequests = Math.max(1, opts?.maxRequests ?? 200);
    if (flushing) {
      const remaining = electronTB
        ? await electronTB.count()
        : webPending.length;
      return { sent: 0, remaining };
    }
    flushing = true;
    const getPending = electronTB
      ? () => electronTB.getPending()
      : async () => webPending;
    const setPending = electronTB
      ? (arr: TimerEvent[]) => electronTB.setPending(arr)
      : async (arr: TimerEvent[]) => {
          webPending.length = 0;
          webPending.push(...arr);
        };
    const count = electronTB
      ? () => electronTB.count()
      : async () => webPending.length;

    let processed = 0;
    try {
      while (processed < maxRequests) {
        const queue = await getPending();
        if (!queue.length) break;
        const ev = queue[0];

        try {
          if (ev.kind === "start") {
            await fetch(`/timers/${ev.trackableType}/${ev.trackableId}/start`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lawyerId: ev.lawyerId,
                source: ev.source ?? "auto",
                clientTime: ev.clientTs,
              }),
            });
          } else {
            await fetch(`/timers/${ev.trackableType}/${ev.trackableId}/pause`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reason: ev.reason,
                clientTime: ev.clientTs,
              }),
            });
          }
          const still = await getPending();
          await setPending(still.slice(1));
          processed += 1;
        } catch {
          break; // red/HTTP: corto y reintento en el próximo flush
        }
      }
      return { sent: processed, remaining: await count() };
    } finally {
      flushing = false;
    }
  },
  count: async () => (electronTB ? electronTB.count() : webPending.length),
};
