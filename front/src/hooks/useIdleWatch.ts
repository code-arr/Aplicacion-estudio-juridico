import { useEffect } from "react";
import { useTimerStore } from "@/store/timer/useTimerStore";
import { IDLE_LIMIT_MS } from "@/types/Timer";

/**
 * Vigila inactividad del usuario (idle).
 * Si pasaron >= IDLE_LIMIT_MS (90s) desde la última actividad → pausa global y contexto.
 */
export function useIdleWatch(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const s = useTimerStore.getState();
      const now = Date.now();
      const idleFor = now - s.lastActivityAt;

      if (idleFor >= IDLE_LIMIT_MS) {
        const endMs = s.lastActivityAt + IDLE_LIMIT_MS; // 👈 exacto 90s desde la última actividad
        // Pausa global
        s.workPause("idle", endMs);
        // Pausa contexto (solo si está corriendo)
        if (s.active && s.contextStatus === "running") {
          s.pause("idle", endMs);
        }
      }
    }, 1000); // 1 Hz, suficiente y barato

    return () => clearInterval(interval);
  }, [enabled]);
}
