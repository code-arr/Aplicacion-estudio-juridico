// electron/sync/syncApi.ts
import axios from "axios";
import type { TimeEntry } from "../../src/types/Timer.js";

export type SyncApi = {
  sendBatch: (entries: TimeEntry[]) => Promise<void>;
};

export function createSyncApi(opts: {
  baseUrl: string;
  getAuthToken?: () => string | null | undefined;
}): SyncApi {
  const base = "http://estudio-backend-dev.us-east-1.elasticbeanstalk.com";

  // 1) instancia axios con baseURL
  const http = axios.create({
    baseURL: base,
    timeout: 15_000,
  });

  // 2) interceptor: agrega Authorization si hay token
  http.interceptors.request.use((config) => {
    const token = opts.getAuthToken?.();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return {
    async sendBatch(entries) {
      if (!entries.length) return;

      try {
        // 3) el back espera { entries } en /v1/time-entries/bulk
        await http.post("/entry-day/bulk", { entries });
        // axios tira error si status no es 2xx, así que si llegamos acá: OK
      } catch (err: any) {
        console.log(err);

        // propagá un error legible para que el backoff haga lo suyo
        const status = err?.response?.status;
        const msg = err?.response?.data ?? err?.message ?? "sync failed";
        throw new Error(
          `sync ${status ?? "ERR"}: ${
            typeof msg === "string" ? msg : JSON.stringify(msg)
          }`
        );
      }
    },
  };
}
