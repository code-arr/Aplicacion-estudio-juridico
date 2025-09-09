// src/hooks/useDocumentActiveTime.ts
import { useEffect, useRef } from "react";
import { usePdfSessionStore } from "@/store/usePdfSession";

type Options = { eco?: boolean; idleSec?: number };
const DEFAULT_IDLE = 180; //3 minutos

/**
 * Trackea tiempo activo y actividad del usuario sobre un doc específico.
 * - Encola segundos con tickActive() SOLO si este doc es el activo en el store.
 * - Marca actividad ante mouse/teclado/scroll para evitar idle.
 * - Pausa/retoma en "visibilitychange".
 * - Hace flushRemainder al desmontar o antes de cerrar la pestaña.
 */
export function useDocumentActiveTime(
  docId: string | null,
  opts: Options = {}
) {
  const { eco = false, idleSec = DEFAULT_IDLE } = opts;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!docId) return;
    const st = usePdfSessionStore.getState();
    st.ensure(docId);

    // helpers
    const startInterval = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        const s = usePdfSessionStore.getState();
        if (s.activeDocId === docId) s.tickActive(docId, 1);
      }, 1000);
    };
    const stopInterval = () => {
      if (!intervalRef.current) return;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    const resetIdleTimer = () => {
      if (!eco) return; // en modo normal no usamos timer de idle aquí
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        // si pasó mucho sin actividad, pausamos y apagamos intervalo
        stopInterval();
        usePdfSessionStore.getState().pause(docId);
      }, idleSec * 1000);
    };

    // actividad del usuario
    const onActivity = () => {
      const s = usePdfSessionStore.getState();
      if (s.activeDocId === docId) s.markActivity(docId);
      if (eco) {
        // eco: encendé intervalo si estaba apagado y reiniciá timer
        startInterval();
        resetIdleTimer();
      }
    };

    // visibilidad
    const onVisibility = () => {
      const s = usePdfSessionStore.getState();
      if (s.activeDocId !== docId) return;
      if (document.hidden) {
        if (eco) stopInterval();
        s.pause(docId);
      } else {
        s.resume(docId);
        if (eco) {
          startInterval();
          resetIdleTimer();
        }
      }
    };

    // before unload
    const onBeforeUnload = async () => {
      await usePdfSessionStore
        .getState()
        .flushRemainder(docId)
        .catch(() => {});
    };

    // listeners
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, {
      passive: true,
      capture: true,
    });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    // arranque
    if (eco) {
      // eco: arranca intervalo + timer de idle
      startInterval();
      resetIdleTimer();
    } else {
      // normal: intervalo permanente
      startInterval();
    }

    // cleanup
    return () => {
      if (eco) {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      }
      stopInterval();
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity, {
        capture: true,
      });
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      usePdfSessionStore
        .getState()
        .flushRemainder(docId)
        .catch(() => {});
    };
  }, [docId, eco, idleSec]);
}

/** (Opcional) Activa/desactiva automáticamente el doc al montar/desmontar el pane */
export function useAutoActivateDoc(docId: string | null) {
  useEffect(() => {
    if (!docId) return;
    const st = usePdfSessionStore.getState();
    st.setActiveDoc(docId);
    return () => {
      usePdfSessionStore.getState().setActiveDoc(null);
    };
  }, [docId]);
}

/* Diferencia con el hook normal
El normal siempre corre un setInterval cada segundo.
Este se apaga si pasan más de 3 minutos sin actividad del usuario → baja el uso de CPU.
Cuando el usuario mueve el mouse/tecla/scroll, se vuelve a encender y se reinicia el contador */
export function useDocumentActiveTimeEco(docId: string | null) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!docId) return;

    const st = usePdfSessionStore.getState();
    st.ensure(docId);

    // Arranca el intervalo de ticks
    const startInterval = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        const st = usePdfSessionStore.getState();
        if (st.activeDocId === docId) {
          st.tickActive(docId, 1);
        }
      }, 1000);
    };

    // Detiene el intervalo (cuando idle largo)
    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Cuando hay actividad → marcamos y reanudamos intervalos
    const onActivity = () => {
      const st = usePdfSessionStore.getState();
      if (st.activeDocId === docId) {
        st.markActivity(docId);
      }
      startInterval();
      resetIdleTimer();
    };

    // Timer que se dispara si pasa mucho sin actividad
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        stopInterval(); // paramos el conteo si no hay actividad prolongada
        st.pause(docId);
      }, IDLE_THRESHOLD_SEC * 1000);
    };

    // Listeners de actividad
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, {
      passive: true,
      capture: true,
    });

    // Visibilidad → pausa/reanuda
    const onVisibility = () => {
      if (st.activeDocId !== docId) return;
      if (document.hidden) {
        stopInterval();
        st.pause(docId);
      } else {
        st.resume(docId);
        startInterval();
        resetIdleTimer();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Flush antes de cerrar pestaña
    const onBeforeUnload = async () => {
      await st.flushRemainder(docId).catch(() => {});
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    // Inicial
    startInterval();
    resetIdleTimer();

    return () => {
      stopInterval();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity, {
        capture: true,
      } as any);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      st.flushRemainder(docId).catch(() => {});
    };
  }, [docId]);
}
