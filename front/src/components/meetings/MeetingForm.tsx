// src/components/meetings/MeetingForm.tsx
import { useEffect, useState } from "react";
import type { MeetingType, Participant } from "@/types/Meeting";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // si lo tenés, si no usa <textarea>
import { createMeeting } from "@/api/meeting";
import { useParams } from "react-router-dom";
import { useMeetingStore } from "@/store/useMeetingStore";
import { localDateTimeToIsoUtc } from "@/utils/dateTime";
import { useClientStore } from "@/store/useClientStore";

type MeetingFormProps = {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lawyerEmail: string; // email del abogado (para participante por defecto)
  defaultParticipants: Participant[]; // [abogadoActual, clienteDelItem]
};

type NewMeeting = {
  name: string;
  startAt: string; // ISO local (del <input type="datetime-local">)
  lawyerEmail: string; // email del abogado
  participants: Participant[]; // mínimo: cliente
  type: MeetingType;
  notes: string;
};

type FieldErrors = Partial<Record<keyof NewMeeting, string>>;

const initialMeeting: NewMeeting = {
  name: "",
  startAt: "",
  lawyerEmail: "",
  participants: [],
  type: "google-meet",
  notes: "",
};

const MeetingForm = ({
  isDialogOpen,
  setIsDialogOpen,
  lawyerEmail,
  defaultParticipants,
}: MeetingFormProps) => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [formData, setFormData] = useState<NewMeeting>(initialMeeting);

  // 🛠️ Separado el manejo de errores y estado de envío (no mezclar con formData)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientDetail = useClientStore((s) => s.clientDetail);

  const fetchMeetingsByClientItemId = useMeetingStore(
    (s) => s.fetchMeetingsByClientItemId
  );

  // cuando se abre, inyectamos participantes por defecto
  useEffect(() => {
    if (isDialogOpen) {
      setFormData((prev) => ({
        ...prev,
        lawyerEmail,
        participants: defaultParticipants,
      }));
      setFieldErrors({});
      setFormError(null);
    } else {
      setFormData(initialMeeting);
      setIsSubmitting(false);
    }
  }, [isDialogOpen, defaultParticipants, lawyerEmail]);

  const set = <K extends keyof NewMeeting>(key: K, value: NewMeeting[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
    setFormError(null);
  };

  // 🛠️ Validación con fieldErrors + formError (patrón consistente)
  const validate = (): boolean => {
    const fe: FieldErrors = {};
    if (!formData.name.trim()) fe.name = "El título es obligatorio.";
    if (!formData.startAt) fe.startAt = "La fecha y hora son obligatorias.";
    if (!formData.type) fe.type = "Seleccioná el tipo.";
    if (!formData.lawyerEmail) fe.lawyerEmail = "Falta el email del abogado.";
    if (!formData.participants?.length)
      fe.participants = "Debe haber al menos un participante.";

    setFieldErrors(fe);

    setFormError(Object.keys(fe).length ? "Revisá los campos marcados." : null);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async () => {
    if (!clientItemId) {
      setFormError("Falta el identificador del Item del cliente.");
      return;
    }

    const clientId = clientDetail?.id;
    if (!clientId) {
      setFormError("No hay cliente activo.");
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    // 🛠️ Consistencia de fechas: convertimos datetime-local a ISO UTC
    const startAtIsoUtc = localDateTimeToIsoUtc(formData.startAt);

    const payload = { ...formData, startAt: startAtIsoUtc };

    try {
      await createMeeting(payload, clientId, clientItemId);
      await fetchMeetingsByClientItemId(clientItemId);

      setIsDialogOpen(false);
      setFormData(initialMeeting);
    } catch (e: any) {
      // 🛠️ Error general normalizado a mensaje simple para UI
      setFormError(e?.message ?? "No se pudo crear la reunión.");
    } finally {
      setIsSubmitting(false);
    }
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Título</Label>
            <Input
              id="name"
              placeholder="Ej: Seguimiento medidas cautelares"
              value={formData.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Fecha/hora */}
          <div className="space-y-1.5">
            <Label htmlFor="startAt">Fecha y hora</Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => set("startAt", e.target.value)}
              aria-invalid={!!fieldErrors.startAt}
            />
            {fieldErrors.startAt && (
              <p className="text-xs text-red-600">{fieldErrors.startAt}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Se convertirá a UTC para reportes consistentes.
            </p>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo de reunión</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => set("type", v as MeetingType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google-meet">Google Meet</SelectItem>
                <SelectItem value="in-person">Presencial</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.type && (
              <p className="text-xs text-red-600">{fieldErrors.type}</p>
            )}
            {formData.type === "google-meet" && (
              <p className="text-xs text-muted-foreground">
                Se creará un enlace de Meet si tu cuenta de Google está
                conectada.
              </p>
            )}
          </div>

          {/* Participants (solo lectura por ahora, con posibilidad de ampliar luego) */}
          <div className="space-y-1.5">
            <Label>Participantes</Label>
            <div className="flex flex-wrap gap-2">
              {formData.participants.map((p, idx) => (
                <span
                  key={`${p.email}-${idx}`}
                  className="text-xs rounded-full border px-2 py-1"
                  title={p.email}
                >
                  {p.name || p.email}
                </span>
              ))}
            </div>
            {fieldErrors.participants && (
              <p className="text-xs text-red-600">{fieldErrors.participants}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Por ahora se agregan automáticamente el abogado y el cliente.
              Luego podés sumar más.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Descripción</Label>
            <Textarea
              id="desc"
              rows={4}
              placeholder="Notas, objetivos, agenda…"
              value={formData.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onSubmit={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear reunión"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingForm;
