// src/components/meetings/EditMeetingModal.tsx
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
import { Textarea } from "@/components/ui/textarea";
import type { Meeting } from "@/types/Meeting";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meeting?: Meeting | null; // 👈 ahora acepta null
  onConfirm: (patch: Partial<Meeting>) => void;
  loading?: boolean;
};

export default function EditMeetingModal({
  open,
  onOpenChange,
  meeting,
  onConfirm,
  loading = false,
}: Props) {
  const isGoogle = meeting?.type === "google-meet";

  // ⬇️ Estados con valores seguros por defecto
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState<Meeting["status"]>("scheduled");
  const [notes, setNotes] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [startAt, setStartAt] = React.useState("");
  const [endAt, setEndAt] = React.useState("");
  const [participantsText, setParticipantsText] = React.useState("");

  // ⬇️ Cuando abre y hay meeting, sincronizamos
  React.useEffect(() => {
    if (open && meeting) {
      setName(meeting.name ?? "");
      setStatus(meeting.status);
      setNotes(meeting.notes ?? "");
      setLocation(meeting.location ?? "");
      setStartAt(meeting.startAt ?? "");
      setEndAt(meeting.endAt ?? "");
      setParticipantsText(
        (meeting.participants ?? []).map((p) => p.email).join(", ")
      );
    }
  }, [open, meeting]);

  const disabledSave = loading || name.trim().length < 2;

  const handleSave = () => {
    if (!meeting) return; // por las dudas
    const patch: Partial<Meeting> = {
      name: name.trim(),
      status,
      notes: notes.trim() || undefined,
    };
    const normalizedPrev = new Map(
      (meeting?.participants ?? []).map((p) => [
        p.email.toLowerCase(),
        p.name ?? "",
      ])
    );

    const emails = participantsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // si no hay emails -> no tocar "participants"
    if (emails.length > 0) {
      patch.participants = emails.map((email) => ({
        email,
        name: normalizedPrev.get(email.toLowerCase()) ?? "", // 👈 name obligatorio
      }));
    }

    // Ahora también permitimos editar estos campos para Google si ya implementaste sync
    patch.location = location?.trim() || undefined;
    patch.startAt = startAt || undefined;
    patch.endAt = endAt || undefined;

    onConfirm(patch);
  };

  // ⬇️ Si no hay meeting, no mostramos el contenido para evitar el crash
  const safeOpen = open && !!meeting;

  return (
    <Dialog open={safeOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogTitle>Editar reunión</DialogTitle>
        <DialogDescription>
          {isGoogle
            ? "Podés cambiar nombre, estado, notas, fecha/horario, ubicación y participantes (se sincroniza con Google)."
            : "Reunión presencial: podés editar todos los campos principales."}
        </DialogDescription>

        {meeting && (
          <>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600">Nombre</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-gray-600">Estado</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Meeting["status"])
                  }
                >
                  <option value="scheduled">Programada</option>
                  <option value="completed">Finalizada</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Notas</label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas internas…"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Ubicación</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Dirección o sala…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Inicio</label>
                  <Input
                    type="datetime-local"
                    value={toLocalInputValue(startAt)}
                    onChange={(e) =>
                      setStartAt(fromLocalInputValue(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Fin (opcional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={toLocalInputValue(endAt)}
                    onChange={(e) =>
                      setEndAt(fromLocalInputValue(e.target.value))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Participantes (emails, separados por coma)
                </label>
                <Input
                  value={participantsText}
                  onChange={(e) => setParticipantsText(e.target.value)}
                  placeholder="cliente@correo.com, colega@estudio.com"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={disabledSave}>
                {loading ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Helpers ISO <-> datetime-local */
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
  return new Date(local).toISOString();
}
