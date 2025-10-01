import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer/useTimerStore";

function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0;
  let pending: any[] | null = null;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    } else {
      pending = args;
      setTimeout(() => {
        if (pending) {
          last = Date.now();
          fn(...pending);
          pending = null;
        }
      }, ms - (now - last));
    }
  }) as T;
}

export function useActivityHeartbeat(opts?: {
  throttleMs?: number;
  enabled?: boolean;
}) {
  const throttleMs = opts?.throttleMs ?? 500;
  const enabled = opts?.enabled ?? true;
  const handlerRef = useRef<() => void>(undefined);

  useEffect(() => {
    if (!enabled) return; // ⬅️ clave

    handlerRef.current = throttle(() => {
      const s = useTimerStore.getState();
      s.markActivity();
      if (s.status !== "running") {
        // si el global está pausado, reanudar
        console.log("Se prende el global desde useActivityHeartbeat");

        s.workStart();
        // si había contexto pausado por idle y sigue activo, reanudar
        if (s.active && !s.startedAtUTC) {
          s.start(s.active, "auto");
        }
      }
    }, throttleMs);

    const onAct = () => handlerRef.current?.();

    const optsPassive = { passive: true as const };
    window.addEventListener("mousemove", onAct, optsPassive);
    window.addEventListener("mousedown", onAct, optsPassive);
    window.addEventListener("wheel", onAct, optsPassive);
    window.addEventListener("touchstart", onAct, optsPassive);
    window.addEventListener("touchmove", onAct, optsPassive);
    window.addEventListener("keydown", onAct);
    window.addEventListener("scroll", onAct, { passive: true, capture: true });

    // cleanup
    return () => {
      window.removeEventListener("mousemove", onAct);
      window.removeEventListener("mousedown", onAct);
      window.removeEventListener("wheel", onAct);
      window.removeEventListener("touchstart", onAct);
      window.removeEventListener("touchmove", onAct);
      window.removeEventListener("keydown", onAct);
      window.removeEventListener("scroll", onAct, true);
    };
  }, [throttleMs, enabled]);
}
