// src/hooks/useIdleWatch.ts
import { useEffect } from "react";
import { IDLE_LIMIT_MS } from "@/types/Timer";
import { useTimerUIStore } from "@/store/useTimerUIStore";

export function useIdleWatch(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    let tripped = false; // evita disparar dos veces
    const id = setInterval(() => {
      if (tripped) return;

      const s = useTimerUIStore.getState();
      if (s.status !== "running") return; // solo si el global está corriendo

      const idleFor = Date.now() - s.lastActivityAt;

      // margen para no “ganarle” al engine (opcional pero recomendado)
      if (idleFor >= IDLE_LIMIT_MS + 1500) {
        tripped = true;
        const endMs = s.lastActivityAt + IDLE_LIMIT_MS;
        console.log("[IdleWatch] firing", { idleFor, endMs });

        // ✅ pasar { reason, effectiveEndMs } (un solo argumento)
        window.timer?.pause?.({ reason: "idle", effectiveEndMs: endMs });
        // ✅ detener también el GLOBAL en el MISMO instante
        window.timer?.workPause?.(endMs);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [enabled]);
}
