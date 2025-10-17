// src/components/processes/ProcessForm.tsx
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
import { createProcess } from "@/api/process";
import { useParams } from "react-router-dom";
import { useProcessStore } from "@/store/useProcessStore";
import { useClientStore } from "@/store/useClientStore";

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

type FieldErrors = Partial<Record<keyof NewProcess, string>>;

const initialItemState: NewProcess = {
  name: "",
  description: "",
  dateTime: "",
  durationSec: 0,
};

const ProcessForm = ({ isDialogOpen, onOpenChange }: ProcessFormProps) => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [newProcess, setNewProcess] = useState<NewProcess>(initialItemState);
  const [saving, setSaving] = useState(false);

  const clientDetail = useClientStore((s) => s.clientDetail);

  const fetchProcessesByClientItemId = useProcessStore(
    (s) => s.fetchProcessesByClientItemId
  );

  // 🛠️ Errores separados y por campo (igual que en MeetingForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validate = (data: NewProcess): boolean => {
    const fe: FieldErrors = {};
    if (!data.name.trim()) fe.name = "Ingresá un nombre.";
    if (!data.dateTime) fe.dateTime = "Elegí fecha y hora de inicio.";
    if (data.durationSec <= 0) fe.durationSec = "Duración debe ser > 0.";
    if (data.durationSec > 12 * 3600)
      fe.durationSec = "Duración máxima: 12 horas.";

    setFieldErrors(fe);
    setFormError(Object.keys(fe).length ? "Revisá los campos marcados." : null);
    return Object.keys(fe).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // 🛠️ Ahora sí funciona porque estamos dentro de <form onSubmit>
    setFormError(null);

    const clientId = clientDetail?.id;
    if (!clientId) {
      setFormError("No hay cliente activo.");
      return;
    }

    if (!validate(newProcess)) return;

    const startedAtIso = localDateTimeToIsoUtc(newProcess.dateTime)!; // ISO UTC

    try {
      setSaving(true);

      await createProcess(newProcess, clientId, clientItemId!);

      await fetchProcessesByClientItemId(clientItemId!);

      onOpenChange(false);
      setNewProcess(initialItemState);
      setFieldErrors({});
    } catch (err: any) {
      setFormError(err?.message || "No se pudo guardar el trámite.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setNewProcess(initialItemState);
          setFieldErrors({});
          setFormError(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Trámite</DialogTitle>
          <DialogDescription>
            Registrar un nuevo trámite realizado fuera del estudio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Nombre */}
          <div className="py-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              type="text"
              id="name"
              value={newProcess.name}
              onChange={(e) =>
                setNewProcess({ ...newProcess, name: e.target.value })
              }
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <div className="text-xs text-red-600">{fieldErrors.name}</div>
            )}
          </div>

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
              aria-invalid={!!fieldErrors.dateTime}
            />
            {fieldErrors.dateTime && (
              <div className="text-xs text-red-600">{fieldErrors.dateTime}</div>
            )}
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
              aria-invalid={!!fieldErrors.durationSec}
            />
            {fieldErrors.durationSec && (
              <div className="text-xs text-red-600">
                {fieldErrors.durationSec}
              </div>
            )}
          </div>

          {formError && <div className="text-sm text-red-600">{formError}</div>}

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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessForm;
