// electron/sync/syncApi.ts
import type { TimeEntry } from "../../src/types/Timer.js";

export type SyncApi = {
  sendBatch: (entries: TimeEntry[]) => Promise<void>;
};

export function createSyncApi(opts: {
  baseUrl: string; // p.ej. https://api.tu-back.com
  getAuthToken?: () => string | null | undefined;
}): SyncApi {
  const base = opts.baseUrl.replace(/\/+$/, "");

  return {
    async sendBatch(entries) {
      if (!entries.length) return;
      const token = opts.getAuthToken?.();
      const res = await fetch(`${base}/api/time-entries/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(entries),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`sync ${res.status}: ${text || res.statusText}`);
      }
    },
  };
}
