// src/hooks/useAppPresenceTimer.ts
import { useEffect } from "react";

export function useAppPresenceTimer(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const ping = () => window.timer?.markActivity?.();

    const onFocus = () => ping();
    const onVisibility = () => {
      if (!document.hidden) ping();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // Si main ya reacciona a presence OS (attachOSPresence), acá NO pausar/reanudar.
    let unsubscribe: (() => void) | undefined;
    if (window.presence?.subscribe) {
      unsubscribe = window.presence.subscribe((ev) => {
        if (
          ev === "app:restored-any" &&
          document.visibilityState === "visible"
        ) {
          ping(); // deja que el heartbeat haga el auto-resume de contexto si corresponde
        }
      });
    }

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe?.();
    };
  }, [enabled]);
}
