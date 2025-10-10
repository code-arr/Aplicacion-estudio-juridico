// src/hooks/useTimerEngineGate.ts
import { useEffect } from "react";

export function useTimerEngineGate(
  enabled: boolean,
  lawyerId?: string,
  appVersion?: string
) {
  useEffect(() => {
    if (!lawyerId || !("timer" in window)) return;

    // habilitar / deshabilitar
    if (enabled) {
      window.timer
        .enable({ lawyerId, appVersion })
        .then(() => {
          window.timer.workStart(); // enciende global ni bien hay sesión
          window.timer.markActivity(); // ancla la primera inactividad al "ahora"
        })
        .catch(() => {});
      console.log("Timer habilitado");
    } else {
      window.timer.disable().catch(() => {});
    }

    // cleanup síncrono
    /* return () => {
      if ("timer" in window) {
        // ignoramos el error si no hay handler (p.ej. web)
        window.timer.disable?.().catch?.(() => {});
      }
    }; */
  }, [enabled, lawyerId, appVersion]);
}
