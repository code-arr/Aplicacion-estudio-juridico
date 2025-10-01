// src/components/timer/TimerDebugBadge.tsx
import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/useTimerStore";
import { tlog } from "@/lib/debugTimer";

function formatHMS(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function TimerDebugBadge() {
  const { status, runningSince, active } = useTimerStore();
  const [now, setNow] = useState(() => Date.now());

  // Tick solo cuando está corriendo
  useEffect(() => {
    if (status !== "running" || !runningSince) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status, runningSince]);

  useEffect(() => {
    if (status === "running" && runningSince) {
      tlog("badge:TICK start", { active, runningSince });
    }
  }, [status, runningSince]);

  if (!active || !runningSince) return null;

  const elapsed = status === "running" ? now - runningSince : 0;

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        padding: "6px 10px",
        borderRadius: 8,
        background: "rgba(37, 99, 235, 0.9)", // azul translúcido
        color: "white",
        fontSize: 12,
        boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
      }}
      title={`${active.type} · ${active.id}`}
    >
      ⏱ {formatHMS(elapsed)} · {status}
    </div>
  );
}
