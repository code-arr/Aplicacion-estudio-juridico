import type { Meeting } from "@/types/Meeting";
import type { TimeEntry } from "@/types/Timer";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function ManualTimeDialog({
  open,
  onOpenChange,
  meeting,
  clientItemId,
  clientId,
  lawyerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meeting: Meeting | null;
  clientItemId?: string;
  clientId?: string;
  lawyerId?: string;
  onSaved?: () => void;
}) {
  const [duration, setDuration] = useState(""); // "HH:MM"
  const [endAt, setEndAt] = useState<string>(""); // datetime-local
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!meeting) return;
    // default: fin = meeting.endAt (si existe) o ahora (en local)
    const def = meeting.endAt ? new Date(meeting.endAt) : new Date();
    // datetime-local necesita "YYYY-MM-DDTHH:MM"
    const pad = (n: number) => String(n).padStart(2, "0");
    const s =
      `${def.getFullYear()}-${pad(def.getMonth() + 1)}-${pad(def.getDate())}` +
      `T${pad(def.getHours())}:${pad(def.getMinutes())}`;
    setEndAt(s);
  }, [meeting]);

  const parseHHMM = (s: string) => {
    const m = s.trim().match(/^(\d{1,2}):([0-5]\d)$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const mi = parseInt(m[2], 10);
    return h * 3600 + mi * 60;
  };

  const handleSave = async () => {
    if (!meeting || !lawyerId) return;
    const sec = parseHHMM(duration);
    if (!sec || sec <= 0) {
      alert("Duración inválida. Usá formato HH:MM, por ejemplo 00:30.");
      return;
    }

    try {
      setSaving(true);

      // endAt local → Date → UTC ISO
      const endLocal = endAt ? new Date(endAt) : new Date();
      const endMs = endLocal.getTime();
      const startMs = endMs - sec * 1000;

      // dayKey desde el inicio (LOCAL)
      const d = new Date(startMs);
      const dayKey = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
      ].join("-");

      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        trackableType: "Meeting",
        trackableId: meeting.id!,
        lawyerId,
        clientId,
        clientItemId,
        dayKey,
        startedAtUTC: new Date(startMs).toISOString(),
        endedAtUTC: new Date(endMs).toISOString(),
        durationSec: sec,
        // pauseReason opcional: uso "switch" para no introducir un nuevo motivo
        pauseReason: "switch",
        // appVersion opcional, si la tuvieras a mano podés setearla
      };

      const n = await window.electronAPI.timeQueue.appendEntry(entry);
      onSaved?.();
      onOpenChange(false);
      alert(`Tiempo cargado (${duration}). Pendientes en cola: ${n}`);
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el tiempo. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Cargar tiempo manual</h3>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Duración (HH:MM)</label>
            <Input
              placeholder="00:30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">
              Fin efectivo (opcional)
            </label>
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Si lo dejás como está, usamos el fin de la reunión o ahora.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-blue-800"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
