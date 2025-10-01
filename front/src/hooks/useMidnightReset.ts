import { useEffect, useRef } from "react";
import { clock } from "@/services/clock";
import { getChileTz } from "@/utils/tz";
import { useTimerStore } from "@/store/timer/useTimerStore";

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
        // 1) cortar global
        const s = useTimerStore.getState();
        s.workPause("close");
        s.workReset();

        // 2) cortar contexto
        const activeBefore = s.active ? { ...s.active } : null;
        if (s.active && s.status === "running") {
          s.pause("close");
        }

        // 3) (opcional) reiniciar el mismo contexto
        if (restart && activeBefore) {
          s.start(activeBefore, "auto");
        }

        // volver a programar para la próxima medianoche
        schedule();
      }, ms) as unknown as number;
    }

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [tz, restart, enabled]);
}
