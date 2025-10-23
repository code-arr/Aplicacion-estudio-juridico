import { useEffect, useRef, useState } from "react";

/**
 * Detecta si la UI está en "deslizamiento" usando eventos de resize.
 * Marca `sliding=true` y lo apaga con un timeout cuando se detiene.
 * Útil para bajar efectos visuales y evitar renders costosos durante ~200ms.
 */
export function useSlidingUI(timeoutMs = 240) {
  const [sliding, setSliding] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const onResize = () => {
      if (!sliding) setSliding(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setSliding(false), timeoutMs);
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [sliding, timeoutMs]);

  return sliding;
}
