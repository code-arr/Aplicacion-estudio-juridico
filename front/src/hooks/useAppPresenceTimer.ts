import { useEffect } from "react";
import { useTimerStore } from "@/store/timer/useTimerStore";
import { useLawyerStore } from "@/store/useLawyerStore";

const PAUSE_ON_ALL_MINIMIZED = true; // ⬅️ flag: ponelo en false si querés ONLY-idle

export function useAppPresenceTimer(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const onFocus = () => {
      // solo actividad; evita doble start
      useTimerStore.getState().markActivity();
    };
    const onVisibility = () => {
      if (!document.hidden) onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // ⬇️ NUEVO: presencia de SO + ventanas
    let unsubscribe: (() => void) | undefined;
    if (typeof window !== "undefined" && window.presence?.subscribe) {
      unsubscribe = window.presence.subscribe((ev) => {
        console.log("[PRESENCE]", ev);
        const s = useTimerStore.getState();

        // Si la ventana vuelve de minimizada/suspendida y querés prender ahí.
        if (ev === "app:restored-any") {
          const s = useTimerStore.getState();
          s.markActivity();
          if (!s.active && document.visibilityState === "visible") {
            const lid = useLawyerStore.getState().lawyer?.id;
            if (lid) {
              console.log("[AUTO-PRIME] presence restored-any");
              if (s.status !== "running") s.workStart();
              s.start({ type: "LawyerApp", id: lid }, "auto");
            }
          }
        }

        // Eventos del SO
        if (
          ev === "app:suspend" ||
          ev === "app:lock" ||
          ev === "app:shutdown"
        ) {
          s.workPause("suspend");
          if (s.active && s.contextStatus === "running") s.pause("suspend");
        }

        // ⬇️ NUEVO: ventanas
        if (PAUSE_ON_ALL_MINIMIZED && ev === "app:minimized-all") {
          s.workPause("idle"); // usamos "idle" para mantener tu semántica
          if (s.active && s.contextStatus === "running") s.pause("idle");
        }
        // "app:restored-any": no reanudamos solos; heartbeat lo hará al primer input
      });
    }

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe?.();
    };
  }, [enabled]);
}
