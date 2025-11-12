import { useRef, useState } from "react";
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
import { createAudience } from "@/api/audience";
import { useParams } from "react-router-dom";
import { useAudienceStore } from "@/store/useAudienceStore";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useClientStore } from "@/store/useClientStore";
import DurationPicker from "@/components/processes/DurationPicker";
import { localDateTimeToIsoUtc } from "@/utils/dateTime";
import type { TimeEntry } from "@/types/Timer";

type AudienceFormProps = {
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void; // <— firma exacta que pide Dialog
};

type NewAudience = {
  name: string;
  file: File | null;
  dateTime: string; // "YYYY-MM-DDTHH:MM"
  durationSec?: number;
  mode?: "virtual" | "presencial";
  error?: string | null;
};

const initialItemState: NewAudience = {
  name: "",
  file: null,
  dateTime: "",
  durationSec: 0,
  mode: "presencial",
  error: null,
};

const ACCEPT = ".pdf";
const MAX_SIZE_MB = 15;

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/* function isAllowedType(file: File) {
  // Validación sencilla por extensión (podés mejorar chequeando MIME real si querés)
  const allowedExt = new Set(["pdf"]);
  const extMatch = file.name.toLowerCase().match(/\.([a-z0-9]+)$/i);
  if (!extMatch) return false;
  const ext = extMatch[1];
  return allowedExt.has(ext);
} */

function isPdf(file: File) {
  const extOk = /\.pdf$/i.test(file.name);
  const mimeOk = file.type === "application/pdf";
  return extOk || mimeOk; // relajado pero útil
}

// valida "YYYY-MM-DDTHH:MM"
function isValidLocalDateTime(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) && !isNaN(new Date(s).getTime())
  );
}

// comprueba que la fecha/hora local no sea futura (compara timestamps locales)
function isPastOrTodayLocalDateTime(s: string): boolean {
  if (!isValidLocalDateTime(s)) return false;
  const input = new Date(s);
  const now = new Date();
  return input.getTime() <= now.getTime();
}

const AudienceForm = ({ isDialogOpen, onOpenChange }: AudienceFormProps) => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [submitting, setSubmitting] = useState(false);

  const lawyer = useLawyerStore((s) => s.lawyer);
  const clientDetail = useClientStore((s) => s.clientDetail);

  const [newAudience, setNewAudience] = useState<NewAudience>(initialItemState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAudiencesByClientItemId = useAudienceStore(
    (s) => s.fetchAudiencesByClientItemId
  );

  function handleFileSelected(file: File | null) {
    if (!file) return;

    // Valida tamaño
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setNewAudience((s) => ({
        ...s,
        error: `El archivo supera ${MAX_SIZE_MB}MB.`,
        file: null,
      }));
      return;
    }
    // Valida tipo
    if (!isPdf(file)) {
      setNewAudience((s) => ({
        ...s,
        error: "Tipo de archivo no permitido. Usá PDF.",
        file: null,
      }));
      return;
    }

    setNewAudience((s) => ({
      ...s,
      file: file,
      name: s.name,
      dateTime: s.dateTime,
      error: null,
    }));
  }

  const handleAddAudience = async () => {
    const name = newAudience.name.trim();
    const file = newAudience.file;
    const dateTime = newAudience.dateTime;
    const clientId = clientDetail?.id;
    if (!clientId) {
      setNewAudience((s) => ({
        ...s,
        error: "No hay cliente activo.",
      }));
      return;
    }
    if (!name || !file || !dateTime) {
      setNewAudience((s) => ({
        ...s,
        error: "Completá todos los campos.",
      }));
      return;
    }

    if (!clientItemId) {
      setNewAudience((s) => ({
        ...s,
        error: "No se encontró el expediente (clientItemId).",
      }));
      return;
    }

    if (!isValidLocalDateTime(dateTime)) {
      setNewAudience((s) => ({
        ...s,
        error: "Ingresá fecha y hora válidas (YYYY-MM-DDTHH:MM).",
      }));
      return;
    }
    if (!isPastOrTodayLocalDateTime(dateTime)) {
      setNewAudience((s) => ({
        ...s,
        error: "La fecha y hora no puede ser futura.",
      }));
      return;
    }

    if (newAudience.durationSec !== undefined && newAudience.durationSec <= 0) {
      setNewAudience((s) => ({ ...s, error: "Ingresá una duración válida." }));
      return;
    }

    setSubmitting(true);

    // Armá el FormData para tu API
    const form = new FormData();
    form.append("name", name);
    form.append("file", file);

    // dateTime local -> ISO UTC para backend (consistente con ProcessForm)
    const localDateTime: string = newAudience.dateTime; // "YYYY-MM-DDTHH:MM"
    const dateTimeIsoUtc: string = localDateTimeToIsoUtc(localDateTime);

    form.append("dateTime", dateTimeIsoUtc);

    // OPCIONAL: también mandar date "YYYY-MM-DD" para compatibilidad con endpoints legacy
    /* const dateOnly = localDateTime.slice(0, 10);
    form.append("date", dateOnly); */

    form.append("clientId", clientId);

    if (newAudience.durationSec && newAudience.durationSec > 0) {
      form.append("durationSec", String(newAudience.durationSec));
    }

    if (newAudience.mode) form.append("mode", newAudience.mode);

    try {
      const created = await createAudience(form, clientItemId!);

      // ENCOLAR TIME-ENTRY PARA AUDIENCIA (mismo patrón que ProcessForm)
      try {
        const durationSec = newAudience.durationSec ?? 0;
        if (durationSec > 0) {
          // startedAtUTC: usamos el ISO que ya enviamos
          const startedAtUTC = dateTimeIsoUtc; // string
          const startMs = Date.parse(startedAtUTC);
          const endedAtUTC = new Date(
            startMs + durationSec * 1000
          ).toISOString();

          // dayKey debe venir del "día local" de inicio:
          // newAudience.dateTime es "YYYY-MM-DDTHH:MM" local -> dayKey = slice(0,10)
          const dayKey = newAudience.dateTime.slice(0, 10);

          const entry: TimeEntry = {
            id: crypto.randomUUID(),
            trackableType: "Audience",
            trackableId: created.id!, // id del backend
            lawyerId: lawyer?.id ?? "",
            clientId,
            clientItemId: clientItemId!,
            dayKey,
            startedAtUTC,
            endedAtUTC,
            durationSec,
            pauseReason: "switch",
          };

          await window.electronAPI.timeQueue.appendEntry(entry);
        }
      } catch (e) {
        console.error("[audience time-entry] append failed", e);
        // opcional: mostrar toast suave pero no romper el flujo
      }

      await fetchAudiencesByClientItemId(clientItemId!);

      onOpenChange(false);
      setNewAudience({
        name: "",
        file: null,
        dateTime: "",
        error: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setNewAudience((s) => ({
        ...s,
        error:
          err?.message ??
          "No se pudo subir el documento. Intentá de nuevo más tarde.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled =
    !newAudience.name.trim() || !newAudience.file || !newAudience.dateTime;

  const fileInputId = "audience-file-input";

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setNewAudience(initialItemState);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar nueva audiencia</DialogTitle>
          <DialogDescription>
            Ingresá el nombre, la fecha y adjuntá el PDF de la audiencia.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddAudience();
          }}
        >
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="audience-name">Nombre de la audiencia</Label>
              <Input
                id="audience-name"
                required
                value={newAudience.name}
                onChange={(e) =>
                  setNewAudience((s) => ({
                    ...s,
                    name: e.target.value,
                    error: null,
                  }))
                }
                placeholder=""
              />
            </div>

            {/* Fecha y hora de inicio (datetime-local, obligatorio) */}
            <div>
              <Label htmlFor="audience-dateTime">Inicio de la audiencia</Label>
              <Input
                id="audience-dateTime"
                type="datetime-local"
                required
                value={newAudience.dateTime}
                onChange={(e) =>
                  setNewAudience((s) => ({ ...s, dateTime: e.target.value }))
                }
                aria-invalid={!!newAudience.error}
              />
              <div className="text-[11px] text-gray-500">
                Se convertirá a UTC para reportes consistentes.
              </div>
            </div>

            {/* Archivo */}
            {newAudience.file ? (
              <div className="mt-2 border rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {newAudience.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF · {formatBytes(newAudience.file.size)}
                  </p>
                  {newAudience.error && (
                    <p className="text-xs text-red-600 mt-1">
                      No se pudo cargar la audiencia
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById(fileInputId)?.click()
                    }
                  >
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setNewAudience((s) => ({
                        ...s,
                        file: null,
                        error: null,
                      }));
                      // limpiar el input para permitir seleccionar el mismo archivo de nuevo
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="mt-2 border border-dashed rounded-lg p-6 text-center cursor-pointer select-none"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0] ?? null;
                  if (!f) return;
                  handleFileSelected(f);
                }}
                onClick={() => document.getElementById(fileInputId)?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    document.getElementById(fileInputId)?.click();
                }}
              >
                <p className="text-sm text-gray-600">
                  Arrastrá el PDF aquí o{" "}
                  <span className="underline">hacé click</span> para
                  seleccionarlo
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Formato permitido: {ACCEPT} · Máx. {MAX_SIZE_MB}MB
                </p>
                {newAudience.error && (
                  <p className="text-xs text-red-600 mt-2">
                    {newAudience.error}
                  </p>
                )}
              </div>
            )}

            {/* Modo (virtual/presencial) */}
            <div className="grid gap-2">
              <Label htmlFor="audience-mode">Modalidad</Label>
              <select
                id="audience-mode"
                value={newAudience.mode}
                onChange={(e) =>
                  setNewAudience((s) => ({
                    ...s,
                    mode: e.target.value as "virtual" | "presencial",
                  }))
                }
                className="h-9 rounded-md border px-2"
              >
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>

            {/* Duración */}
            <div>
              <DurationPicker
                label="Duración de la audiencia"
                valueSec={newAudience.durationSec ?? 0}
                onChange={(sec: number) =>
                  setNewAudience((s) => ({ ...s, durationSec: sec }))
                }
                maxHours={12}
                showSeconds={false}
              />
            </div>

            {newAudience.error && (
              <p className="text-xs text-red-600 mt-2" aria-live="polite">
                {newAudience.error}
              </p>
            )}

            <input
              id={fileInputId}
              type="file"
              className="hidden"
              accept={ACCEPT}
              onClick={(e) => {
                // esto garantiza que si el usuario elige el mismo archivo A, igual dispare onChange
                (e.currentTarget as HTMLInputElement).value = "";
              }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return;
                handleFileSelected(f);
              }}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isDisabled || submitting}>
              {submitting ? "Subiendo..." : "Agregar Audiencia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AudienceForm;
