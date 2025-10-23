import { useEffect, useRef, useState } from "react";

/**
 * Expone `sliding` verdadero mientras el sidebar está animando.
 * - Escucha eventos custom:
 *   - 'sidebar:transition-start'  -> sliding = true
 *   - 'sidebar:transition-end'    -> sliding = false
 * - Fallback por window.resize, por si en algún layout no emiten los eventos.
 */
export function useSlidingUI(timeoutMs = 240) {
  const [sliding, setSliding] = useState(false);

  // timeouts de seguridad/fallback
  const safetyTimer = useRef<number | null>(null);
  const resizeTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearSafety = () => {
      if (safetyTimer.current) {
        window.clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
    };
    const clearResize = () => {
      if (resizeTimer.current) {
        window.clearTimeout(resizeTimer.current);
        resizeTimer.current = null;
      }
    };

    const onStart = () => {
      setSliding(true);
      clearSafety();
      // Si por algún motivo no llega el "end", cortamos solos
      safetyTimer.current = window.setTimeout(() => {
        setSliding(false);
        safetyTimer.current = null;
      }, Math.max(1, Math.round(timeoutMs * 1.5)));
    };

    const onEnd = () => {
      clearSafety();
      setSliding(false);
    };

    const onResize = () => {
      // Fallback: si el layout usa width/margins y no emite eventos
      if (!sliding) setSliding(true);
      clearResize();
      resizeTimer.current = window.setTimeout(() => {
        setSliding(false);
        resizeTimer.current = null;
      }, timeoutMs);
    };

    window.addEventListener(
      "sidebar:transition-start",
      onStart as EventListener
    );
    window.addEventListener("sidebar:transition-end", onEnd as EventListener);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener(
        "sidebar:transition-start",
        onStart as EventListener
      );
      window.removeEventListener(
        "sidebar:transition-end",
        onEnd as EventListener
      );
      window.removeEventListener("resize", onResize);
      clearSafety();
      clearResize();
    };
  }, [sliding, timeoutMs]);

  return sliding;
}
