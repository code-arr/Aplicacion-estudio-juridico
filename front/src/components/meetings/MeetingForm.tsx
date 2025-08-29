// MeetingForm.tsx
import { useEffect, useState } from "react";
import type { MeetingType, Participant } from "@/types/Meeting";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea"; // si lo tenés, si no usa <textarea>

type MeetingFormProps = {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  defaultParticipants: Participant[]; // [abogadoActual, clienteDelItem]
};

type NewMeeting = {
  name: string;
  startAt: string; // ISO local (del <input type="datetime-local">)
  participants: Participant[]; // mínimo: abogado + cliente
  meetingType: MeetingType;
  description?: string;
  error?: string | null;
};

const initialMeeting: NewMeeting = {
  name: "",
  startAt: "",
  participants: [],
  meetingType: "google-meet",
  description: "",
  error: null,
};

const MeetingForm = ({
  isDialogOpen,
  setIsDialogOpen,
  defaultParticipants,
}: MeetingFormProps) => {
  const [form, setForm] = useState<NewMeeting>(initialMeeting);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // cuando se abre, inyectamos participantes por defecto
  useEffect(() => {
    if (isDialogOpen) {
      setForm((prev) => ({
        ...prev,
        participants: defaultParticipants,
        error: null,
      }));
    } else {
      setForm(initialMeeting);
      setIsSubmitting(false);
    }
  }, [isDialogOpen, defaultParticipants]);

  const handleChange = (key: keyof NewMeeting, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value, error: null }));

  /*   const validate = (): string | null => {
    if (!form.name.trim()) return "El título de la reunión es obligatorio.";
    if (!form.startAt) return "La fecha y hora de inicio son obligatorias.";
    if (!form.participants?.length)
      return "La reunión debe tener al menos un participante.";
    if (!form.meetingType) return "Seleccioná el tipo de reunión.";
    return null;
  }; */

  const handleSubmit = async () => {
    /*     const err = validate();
    if (err) return setForm((prev) => ({ ...prev, error: err }));

    try {
      setIsSubmitting(true);
      await onCreate?.(form);
      setIsDialogOpen(false);
    } catch (e: any) {
      setForm((prev) => ({
        ...prev,
        error: e?.message ?? "No se pudo crear la reunión.",
      }));
      setIsSubmitting(false);
    } */
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nueva reunión</DialogTitle>
          <DialogDescription>
            Creá una reunión para este Item.
          </DialogDescription>
        </DialogHeader>

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Título</Label>
          <Input
            id="name"
            placeholder="Ej: Seguimiento medidas cautelares"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        {/* Fecha/hora */}
        <div className="space-y-1.5">
          <Label htmlFor="startAt">Fecha y hora</Label>
          <Input
            id="startAt"
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => handleChange("startAt", e.target.value)}
          />
        </div>

        {/* Tipo */}
        <div className="space-y-1.5">
          <Label>Tipo de reunión</Label>
          <Select
            value={form.meetingType}
            onValueChange={(v) => handleChange("meetingType", v as MeetingType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google-meet">Google Meet</SelectItem>
              <SelectItem value="in-person">Presencial</SelectItem>
            </SelectContent>
          </Select>
          {form.meetingType === "google-meet" && (
            <p className="text-xs text-muted-foreground">
              Se creará un enlace de Meet si tu cuenta de Google está conectada.
            </p>
          )}
        </div>

        {/* Participants (solo lectura por ahora, con posibilidad de ampliar luego) */}
        <div className="space-y-1.5">
          <Label>Participantes</Label>
          <div className="flex flex-wrap gap-2">
            {form.participants.map((p, idx) => (
              <span
                key={`${p.email}-${idx}`}
                className="text-xs rounded-full border px-2 py-1"
                title={p.email}
              >
                {p.name || p.email}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Por ahora se agregan automáticamente el abogado y el cliente. Luego
            podés sumar más.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="desc">Descripción</Label>
          <Textarea
            id="desc"
            rows={4}
            placeholder="Notas, objetivos, agenda…"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        {form.error && <p className="text-sm text-red-600">{form.error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creando…" : "Crear reunión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingForm;
