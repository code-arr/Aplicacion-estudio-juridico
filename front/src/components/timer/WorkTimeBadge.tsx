// src/components/timer/WorkTimeBadge.tsx
import { useTimerUIStore } from "@/store/useTimerUIStore";

type Props = {
  className?: string;
  /** Ocultar si el global está parado (default: true = mostrar siempre que esté habilitado) */
  showWhenStopped?: boolean;
};

const formatHMS = (s: number) => {
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

export default function WorkTimeBadge({
  className,
  showWhenStopped = true,
}: Props) {
  // Estado proveniente del engine (main) vía store UI
  const enabled = useTimerUIStore((s) => s.enabled);
  const status = useTimerUIStore((s) => s.status); // "running" | "stopped"
  const totalSec = useTimerUIStore((s) => s.accumSecToday);
  const isBound = useTimerUIStore((s) => s.__bound);

  // Si todavía no se bindeó la suscripción o no está habilitado, no mostramos nada
  if (!isBound || !enabled) return null;
  if (!showWhenStopped && status !== "running") return null;

  const clock = formatHMS(totalSec);

  return (
    <div
      title="Tiempo global de la jornada"
      aria-label="Tiempo global de la jornada"
      className={[
        "fixed right-3 bottom-3 z-[50]",
        // caja
        "px-2.5 py-1.5 rounded-lg shadow-md bg-black/70",
        // texto
        "text-white text-xs tabular-nums select-none",
        // no bloquear clics de la UI
        "pointer-events-none",
        // fade-in suave cuando pasa a habilitado
        "opacity-100 transition-opacity duration-300",
        className || "",
      ].join(" ")}
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      {clock}
    </div>
  );
}

/* import { useMemo } from "react";
import { useTimerUIStore } from "@/store/useTimerUIStore";

export default function WorkTimeBadge({ className }: { className?: string }) {
  const accumSecToday = useTimerUIStore((s) => s.accumSecToday);

  const [hh, mm, ss] = useMemo(() => {
    const total = Math.max(0, Math.floor(accumSecToday));
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return [h, m, s] as const;
  }, [accumSecToday]);

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        padding: "6px 10px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        fontSize: 12,
        zIndex: 50,
        userSelect: "none",
      }}
      title="Tiempo global de la jornada"
    >
      {hh}:{mm}:{ss}
    </div>
  );
} */

/* import { useEffect, useRef, useState } from "react";
import { useTimerUIStore } from "@/store/useTimerUIStore";

export default function WorkTimeBadge({ className }: { className?: string }) {
  const status = useTimerUIStore((s) => s.status);
  const runningSince = useTimerUIStore((s) => s.runningSince ?? null);
  const accumSecToday = useTimerUIStore((s) => s.accumSecToday);

  const [now, setNow] = useState(() => Date.now());
  const lastSecondRef = useRef(Math.floor(now / 1000));
  const rafRef = useRef<number | null>(null);

  // ⬇️ Baseline "congelado" mientras está corriendo
  const frozenBaseRef = useRef<number>(accumSecToday);
  const frozenSinceRef = useRef<number | null>(runningSince);

  // Recalibrar baseline SOLO cuando:
  // - entra en running
  // - cambia runningSince (p.ej. corte de medianoche)
  // - sale de running (pausa/stop)
  useEffect(() => {
    if (status === "running" && runningSince) {
      frozenBaseRef.current = accumSecToday; // capturamos base
      frozenSinceRef.current = runningSince; // capturamos t0
    } else {
      // no running => el mirror manda
      frozenBaseRef.current = accumSecToday;
      frozenSinceRef.current = null;
    }
  }, [status, runningSince]); // 👈 importante NO depender de accumSecToday aquí

  // Tick local: solo actualiza "now" cuando cambia el segundo
  useEffect(() => {
    const loop = () => {
      const sec = Math.floor(Date.now() / 1000);
      if (sec !== lastSecondRef.current) {
        lastSecondRef.current = sec;
        setNow(Date.now());
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  let totalSec = accumSecToday;
  if (status === "running" && frozenSinceRef.current) {
    const liveSec = Math.max(
      0,
      Math.floor((now - frozenSinceRef.current) / 1000)
    );
    totalSec = frozenBaseRef.current + liveSec;
  }

  const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        padding: "6px 10px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        fontSize: 12,
        zIndex: 50,
        userSelect: "none",
      }}
      title="Tiempo global de la jornada"
    >
      {hh}:{mm}:{ss}
    </div>
  );
}
 */
