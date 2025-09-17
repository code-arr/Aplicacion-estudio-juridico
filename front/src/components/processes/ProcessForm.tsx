import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localDateTimeToIsoUtc } from "@/utils/dateTime";
import DurationPicker from "./DurationPicker";
import { createManualTimeEntry } from "@/api/timer";
import { createProcess } from "@/api/process";

type ProcessFormProps = {
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void; // <— firma exacta que pide Dialog
};

type NewProcess = {
  name: string;
  description: string;
  dateTime: string;
  durationSec: number; // en segundos
};

const initialItemState: NewProcess = {
  name: "",
  description: "",
  dateTime: "",
  durationSec: 0,
};

const ProcessForm = ({ isDialogOpen, onOpenChange }: ProcessFormProps) => {
  const [newProcess, setNewProcess] = useState<NewProcess>(initialItemState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newProcess.name.trim()) return setError("Ingresá un nombre.");
    if (!newProcess.dateTime) return setError("Elegí fecha y hora de inicio.");
    if (newProcess.durationSec <= 0)
      return setError("Elegí una duración mayor a 0.");
    if (newProcess.durationSec > 12 * 3600)
      return setError("Duración máxima: 12 horas.");

    const startedAtIso = localDateTimeToIsoUtc(newProcess.dateTime)!; // ISO UTC

    try {
      setSaving(true);

      // 1) Crear el trámite (si tu API guarda también la fecha de inicio del trámite, podés mandar startedAtIso)
      const proc = await createProcess({
        name: newProcess.name.trim(),
        dateTime: startedAtIso, // o startedAtIso según cómo lo quieras persistir en Process
        description: newProcess.description?.trim() || undefined,
        durationSec: newProcess.durationSec,
      });

      // 2) Crear la TimeEntry manual (usa startedAt + durationSec)
      try {
        await createManualTimeEntry({
          trackableType: "Process",
          trackableId: proc.id,
          source: "manual",
          durationSec: newProcess.durationSec,
          startedAt: startedAtIso, // ← clave: ahora mandamos startedAt
        });
      } catch {
        // Offline/HTTP: encolá para flush posterior (opcional)
        await window.electronAPI.timeBuffer.append({
          /* lawyerId, */
          kind: "manual",
          trackableType: "Process",
          trackableId: proc.id,
          durationSec: newProcess.durationSec,
          startedAt: startedAtIso,
          clientTs: new Date().toISOString(),
        });
        setError("Tiempo encolado para enviar cuando haya conexión ✅");
      }

      onOpenChange(false);
      setNewProcess(initialItemState);
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el trámite.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setNewProcess(initialItemState);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Trámite</DialogTitle>
          <DialogDescription>
            Registrar un nuevo trámite realizado fuera del estudio.
          </DialogDescription>
        </DialogHeader>

        {/* Nombre */}
        <div className="py-4">
          <Label htmlFor="name">Nombre</Label>
          <Input
            type="text"
            id="name"
            value={newProcess.name}
            onChange={(e) =>
              setNewProcess({ ...newProcess, name: e.target.value })
            }
          />
        </div>

        <div className="grid gap-4">
          {/* Inicio del trámite (datetime-local) */}
          <div>
            <Label htmlFor="startedAt">Inicio del trámite</Label>
            <Input
              id="startedAt"
              type="datetime-local"
              value={newProcess.dateTime}
              onChange={(e) =>
                setNewProcess({ ...newProcess, dateTime: e.target.value })
              }
            />
            <div className="text-[11px] text-gray-500">
              Se convertirá a UTC para reportes consistentes.
            </div>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              className="w-full border rounded p-2 outline-none"
              rows={3}
              value={newProcess.description}
              onChange={(e) =>
                setNewProcess({ ...newProcess, description: e.target.value })
              }
            />
          </div>

          {/* Duración (hrs/min) */}
          <div>
            <DurationPicker
              label="Duración"
              valueSec={newProcess.durationSec}
              onChange={(sec) =>
                setNewProcess({ ...newProcess, durationSec: sec })
              }
              maxHours={12}
            />
          </div>

          {error && <div className="text-sm">{error}</div>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setNewProcess(initialItemState);
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onSubmit={handleSubmit} type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessForm;
