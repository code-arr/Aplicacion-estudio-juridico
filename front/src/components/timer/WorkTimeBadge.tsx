import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/timer/useTimerStore";

export default function WorkTimeBadge({ className }: { className?: string }) {
  const status = useTimerStore((s) => s.status);
  const runningSince = useTimerStore((s) => s.runningSince); // epoch ms
  const accumSecToday = useTimerStore((s) => s.accumSecToday); // segundos

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ⚠️ calcular en segundos, no mezclar ms con s
  const liveSec =
    status === "running" && runningSince
      ? Math.max(0, Math.floor((now - runningSince) / 1000))
      : 0;

  const totalSec = accumSecToday + liveSec;

  // opcional: logs útiles
  // console.log({ accumSecToday, liveSec, totalSec });

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
