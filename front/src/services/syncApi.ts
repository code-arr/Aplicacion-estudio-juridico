// src/services/syncApi.ts
import type { TimeEntry } from "@/types/Timer";
import type { SyncApi } from "./syncService";

export function createSyncApi(baseUrl = "/api"): SyncApi {
  return {
    async sendBatch(entries: TimeEntry[]) {
      const res = await fetch(`${baseUrl}/time-entries/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // El backend debe hacer upsert por entry.id (idempotente)
        body: JSON.stringify({ entries }),
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`sendBatch failed: ${res.status} ${txt}`);
      }
    },
  };
}
