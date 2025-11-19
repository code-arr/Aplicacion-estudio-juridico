// src/hooks/useMainLogs.ts
import { useEffect } from "react";

export function useMainLogs() {
  useEffect(() => {
    const unsub = (window as any).mainLog?.onLog?.(
      (entry: { level: string; payload: string[] }) => {
        const { level, payload } = entry;
        const msg = payload.map((p: string) => {
          // intentar parsear JSON si se ve como JSON
          try {
            return JSON.parse(p);
          } catch {
            return p;
          }
        });
        // reenviamos a la consola del renderer (DevTools)
        if (level === "error") console.error("[main->renderer]", ...msg);
        else if (level === "warn") console.warn("[main->renderer]", ...msg);
        else console.log("[main->renderer]", ...msg);
      }
    );

    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, []);
}
