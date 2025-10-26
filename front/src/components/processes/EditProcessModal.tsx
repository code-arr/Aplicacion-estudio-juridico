// src/components/processes/EditProcessModal.tsx
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // o <textarea>
import type { Process } from "@/types/Process";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  process: Process; // actual
  onConfirm: (patch: Partial<Process>) => void; // la page hace la API
  loading?: boolean;
};

export default function EditProcessModal({
  open,
  onOpenChange,
  process,
  onConfirm,
  loading = false,
}: Props) {
  const [name, setName] = React.useState(process.name ?? "");
  const [description, setDescription] = React.useState(
    process.description ?? ""
  );
  const [dateTime, setDateTime] = React.useState(process.dateTime ?? "");
  const [durationMin, setDurationMin] = React.useState(
    process.durationSec ? Math.floor(process.durationSec / 60).toString() : ""
  );

  React.useEffect(() => {
    if (open) {
      setName(process.name ?? "");
      setDescription(process.description ?? "");
      setDateTime(process.dateTime ?? "");
      setDurationMin(
        process.durationSec
          ? Math.floor(process.durationSec / 60).toString()
          : ""
      );
    }
  }, [open, process]);

  const disabled = loading || name.trim().length < 2;

  const handleSave = () => {
    const minutes =
      durationMin.trim() === "" ? null : Math.max(0, Number(durationMin));
    const patch: Partial<Process> = {
      name: name.trim(),
      description: description.trim() || undefined,
      dateTime: dateTime || undefined, // ISO (desde input)
      durationSec: minutes === null ? null : minutes * 60, // a segundos
    };
    onConfirm(patch);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogTitle>Editar trámite</DialogTitle>
        <DialogDescription>Modificá los datos del trámite.</DialogDescription>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-gray-600">Nombre</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-gray-600">Descripción</label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Fecha y hora</label>
              <Input
                type="datetime-local"
                value={toLocalInputValue(dateTime)}
                onChange={(e) =>
                  setDateTime(fromLocalInputValue(e.target.value))
                }
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">
                Duración (minutos)
              </label>
              <Input
                type="number"
                min={0}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="Ej: 45"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={disabled}>
            {loading ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
function fromLocalInputValue(local: string) {
  if (!local) return "";
  const d = new Date(local);
  return d.toISOString();
}
