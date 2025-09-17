import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/useTimerStore";

const TimeBadge = () => {
  const { active, status } = useTimerStore();
  const [elapsed, setElapsed] = useState(0);

  // contador en vivo
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status, active?.id]);

  if (!active) return null;

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="absolute top-2 right-2 bg-blue-600/90 text-white px-2 py-1 rounded-md text-xs shadow-md">
      ⏱ {hh}:{mm}:{ss} ·{" "}
      {status === "running"
        ? "En curso"
        : status === "paused"
        ? "Pausado"
        : "Detenido"}
    </div>
  );
};

export default TimeBadge;
