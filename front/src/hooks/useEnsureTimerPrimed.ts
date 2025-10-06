// src/hooks/useEnsureTimerPrimed.ts
import { useEffect, useRef } from "react";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useTimerUIStore } from "@/store/useTimerUIStore";

export function useEnsureTimerPrimed(enabled: boolean) {
  const lawyerId = useLawyerStore((s) => s.lawyer?.id);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!enabled || !lawyerId) return;

    const tryPrime = (src: string) => {
      if (doneRef.current) return;
      if (document.visibilityState !== "visible") return;

      const ui = useTimerUIStore.getState();
      if (!ui.active) {
        console.log("[AUTO-PRIME]", src);
        // 🔸 Todas las acciones van al motor en main:
        window.timer?.start({ type: "LawyerApp", id: lawyerId });
      }
      if (useTimerUIStore.getState().active) {
        doneRef.current = true;
      }
    };

    const raf = requestAnimationFrame(() => tryPrime("raf"));
    const t = setTimeout(() => tryPrime("delay120ms"), 120);

    const onVis = () => tryPrime("visibilitychange");
    const onFocus = () => tryPrime("focus");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    let tries = 0;
    const interval = setInterval(() => {
      if (doneRef.current) return clearInterval(interval);
      tryPrime(`retry-${++tries}s`);
      if (tries >= 10) clearInterval(interval);
    }, 1000);

    let unsubscribe: (() => void) | undefined;
    if (typeof window !== "undefined" && window.presence?.subscribe) {
      unsubscribe = window.presence.subscribe((ev) => {
        if (
          ev === "app:restored-any" ||
          ev === "app:resume" ||
          ev === "app:unlock"
        ) {
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
