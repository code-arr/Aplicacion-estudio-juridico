// src/hooks/useFocusContext.ts
import { useEffect, useRef } from "react";
import type { Trackable } from "@/types/Timer";
import { useTimerUIStore } from "@/store/useTimerUIStore";

/**
 * Declara el trackable como “dueño” del contexto mientras el componente esté montado.
 * Evita switches redundantes si ya está activo el mismo trackable.
 * Al desmontar, cierra el contexto SOLO si sigue siendo el mismo.
 */
export function useFocusContext(trackable: Trackable | null) {
  const openedRef = useRef<Trackable | null>(null);

  useEffect(() => {
    if (!trackable) return; // 👈 no hacemos switchTo(null) por defecto

    const current = useTimerUIStore.getState().active;
    /*     const same =
      (!!current &&
        !!trackable &&
        current.id === trackable.id &&
        current.type === trackable.type) ||
      (!current && !trackable); */
    const same =
      !!current &&
      current.id === trackable.id &&
      current.type === trackable.type;

    // Solo “switchTo” si cambia realmente el dueño del contexto
    if (!same) {
      window.timer?.switchTo(trackable);
    }
    openedRef.current = trackable;

    return () => {
      const now = useTimerUIStore.getState().active;
      /*       const stillSame =
        (!!now &&
          !!openedRef.current &&
          now.id === openedRef.current.id &&
          now.type === openedRef.current.type) ||
        (!now && !openedRef.current); */
      const stillSame =
        !!now &&
        !!openedRef.current &&
        now.id === openedRef.current.id &&
        now.type === openedRef.current.type;

      // Si al desmontar seguimos siendo el dueño, cerramos el contexto
      if (stillSame) {
        window.timer?.pause("close");
      }
      openedRef.current = null;
    };
  }, [trackable?.type, trackable?.id]);

  // Reafirmar al ganar foco (evita switch redundante)
  useEffect(() => {
    if (!trackable) return;

    const reassert = () => {
      const current = useTimerUIStore.getState().active;
      const same =
        !!current &&
        current.id === trackable.id &&
        current.type === trackable.type;
      if (!same) window.timer?.switchTo(trackable);
    };

    const onFocus = () => reassert();
    const onVis = () => {
      if (document.visibilityState === "visible") reassert();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [trackable?.type, trackable?.id]);
}
