// src/hooks/useActivityHeartbeat.ts
import { useEffect, useRef } from "react";
import { useTimerUIStore } from "@/store/useTimerUIStore";

function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0,
    t: any;
  return ((...args: any[]) => {
    const now = Date.now();
    const remain = ms - (now - last);
    if (remain <= 0) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(t);
      t = setTimeout(() => {
        last = Date.now();
        fn(...args);
      }, remain);
    }
  }) as T;
}

export function useActivityHeartbeat(opts?: {
  throttleMs?: number;
  enabled?: boolean;
}) {
  const throttleMs = opts?.throttleMs ?? 500;
  const enabled = opts?.enabled ?? true;

  const get = useTimerUIStore; // mirror del engine
  const handlerRef = useRef<() => void>(undefined);

  useEffect(() => {
    if (!enabled) return;

    handlerRef.current = throttle(() => {
      // 1) avisamos actividad SIEMPRE
      window.timer?.markActivity?.();

      // 2) auto-start global si está detenido (sin depender de un contexto)
      const s = get.getState();
      if (s.status !== "running") {
        window.timer?.workStart?.(); // 👈 arranca el global en el primer input
      }

      // 3) si hay contexto activo pero no corriendo, reanudarlo
      if (s.active && s.contextStatus !== "running") {
        window.timer?.start?.(s.active);
      }
    }, throttleMs);

    const onAct = () => handlerRef.current?.();
    const passive = { passive: true } as const;

    window.addEventListener("mousemove", onAct, passive);
    window.addEventListener("mousedown", onAct, passive);
    window.addEventListener("wheel", onAct, passive);
    window.addEventListener("touchstart", onAct, passive);
    window.addEventListener("touchmove", onAct, passive);
    window.addEventListener("keydown", onAct);
    window.addEventListener("scroll", onAct, { passive: true, capture: true });

    return () => {
      window.removeEventListener("mousemove", onAct);
      window.removeEventListener("mousedown", onAct);
      window.removeEventListener("wheel", onAct);
      window.removeEventListener("touchstart", onAct);
      window.removeEventListener("touchmove", onAct);
      window.removeEventListener("keydown", onAct);
      window.removeEventListener("scroll", onAct, true);
    };
  }, [enabled, throttleMs]);
}
