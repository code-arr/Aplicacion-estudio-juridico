// src/hooks/useMidnightReset.ts
/* import { useEffect, useRef } from "react";
import { clock } from "@/services/clock";
import { getChileTz } from "@/utils/tz";
import { useTimerUIStore } from "@/store/useTimerUIStore";

export function useMidnightReset(opts?: {
  tz?: string;
  restartContextAfterCut?: boolean; // default true
  enabled?: boolean;
}) {
  const tz = opts?.tz ?? getChileTz();
  const restart = opts?.restartContextAfterCut ?? true;
  const enabled = opts?.enabled ?? true;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function schedule() {
      const next = clock.nextMidnightMs(tz);
      const ms = Math.max(0, next - Date.now());
      timerRef.current = window.setTimeout(() => {
        const ui = useTimerUIStore.getState();
        const activeBefore = ui.active ? { ...ui.active } : null;

        // Avisamos corte de jornada: el engine en main debe hacer el reset de acumulados allí.
        window.timer?.pause("close");

        // (opcional) reiniciar mismo contexto luego del corte
        if (restart && activeBefore) {
          window.timer?.start(activeBefore);
        }

        schedule(); // reprogramar para la próxima medianoche
      }, ms) as unknown as number;
    }

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [tz, restart, enabled]);
} */
