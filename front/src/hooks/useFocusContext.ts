import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer/useTimerStore";
import type { Trackable } from "@/types/Timer";

/**
 * Asigna foco de contexto al montar y lo cierra al desmontar si sigue siendo el mismo.
 */
export function useFocusContext(trackable: Trackable | null) {
  const openedRef = useRef<Trackable | null>(null);

  useEffect(() => {
    const s = useTimerStore.getState();
    s.switchTo(trackable);
    openedRef.current = trackable;

    return () => {
      const current = useTimerStore.getState().active;
      const opened = openedRef.current;
      const same =
        (!!current &&
          !!opened &&
          current.id === opened.id &&
          current.type === opened.type) ||
        (!current && !opened);
      if (same) {
        useTimerStore.getState().pause("close");
      }
      openedRef.current = null;
    };
  }, [trackable?.type, trackable?.id]);
}
