import axios from "./axios";
import type { Process } from "@/types/Process";

export async function createProcess(process: Process) {
  const res = await fetch("/processes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(process),
  });
  if (!res.ok) throw new Error("No se pudo crear el trámite");
  return res.json() as Promise<{ id: string }>; // ← processId
}
