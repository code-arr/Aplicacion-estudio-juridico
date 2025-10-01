import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer/useTimerStore";
import { useLawyerStore } from "@/store/useLawyerStore";

export function useEnsureTimerPrimed(enabled: boolean) {
  const lawyerId = useLawyerStore((s) => s.lawyer?.id);
  const doneRef = useRef(false); // se pone en true cuando ya hay contexto activo

  useEffect(() => {
    if (!enabled || !lawyerId) return;

    const tryPrime = (src: string) => {
      // si ya lo logramos, no hacemos nada
      if (doneRef.current) return;

      const s = useTimerStore.getState();

      // No arrancamos si el doc no es visible (evita sumar minimizado)
      if (document.visibilityState !== "visible") return;

      if (!s.active) {
        console.log("[AUTO-PRIME]", src);
        if (s.status !== "running") s.workStart(); // prende global
        s.start({ type: "LawyerApp", id: lawyerId }, "auto"); // contexto base
      }

      // si ya quedó activo, marcamos done
      if (useTimerStore.getState().active) {
        doneRef.current = true;
      }
    };

    // A) Intento inmediato (post-paint + mini delay)
    const raf = requestAnimationFrame(() => tryPrime("raf"));
    const t = setTimeout(() => tryPrime("delay120ms"), 120);

    // B) Reintentos en visibility/focus
    const onVis = () => {
      console.log("[VIS change]:", document.visibilityState);
      tryPrime("visibilitychange");
    };
    const onFocus = () => {
      console.log("[FOCUS]");
      tryPrime("focus");
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    // C) Reintento cada 1s hasta lograrlo (máximo 10 intentos)
    let tries = 0;
    const interval = setInterval(() => {
      if (doneRef.current) {
        clearInterval(interval);
        return;
      }
      tryPrime(`retry-${++tries}s`);
      if (tries >= 10) clearInterval(interval);
    }, 1000);

    // D) Presencia del SO (Electron) — restored/resume/unlock
    let unsubscribe: (() => void) | undefined;
    if (typeof window !== "undefined" && window.presence?.subscribe) {
      unsubscribe = window.presence.subscribe((ev) => {
        if (
          ev === "app:restored-any" ||
          ev === "app:resume" ||
          ev === "app:unlock"
        ) {
          console.log("[PRESENCE]", ev);
          tryPrime(`presence:${ev}`);
        }
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      unsubscribe?.();
      doneRef.current = false;
    };
  }, [enabled, lawyerId]);
}
