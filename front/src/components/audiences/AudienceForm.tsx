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
import { useClientStore } from "@/store/useClientStore";

type AudienceFormProps = {
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void; // <— firma exacta que pide Dialog
};

type NewAudience = {
  name: string;
  file: File | null;
  date: string; // "YYYY-MM-DD"
  error?: string | null;
};

const initialItemState: NewAudience = {
  name: "",
  file: null,
  date: "",
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

function isAllowedType(file: File) {
  // Validación sencilla por extensión (podés mejorar chequeando MIME real si querés)
  const allowedExt = new Set(["pdf"]);
  const extMatch = file.name.toLowerCase().match(/\.([a-z0-9]+)$/i);
  if (!extMatch) return false;
  const ext = extMatch[1];
  return allowedExt.has(ext);
}

function isPdf(file: File) {
  const extOk = /\.pdf$/i.test(file.name);
  const mimeOk = file.type === "application/pdf";
  return extOk || mimeOk; // relajado pero útil
}

// Devuelve un Date si el string es una fecha válida en calendario (incluye bisiestos).
function parseISODateYYYYMMDD(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  // new Date(año, mes-1, día) usa calendario local (no UTC) y normaliza si está fuera de rango.
  const dt = new Date(y, mo - 1, d);
  const isSame =
    dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
  return isSame ? dt : null;
}

function isPastOrToday(s: string): boolean {
  const dt = parseISODateYYYYMMDD(s);
  if (!dt) return false;
  const today = new Date();
  // Comparación por fecha local (00:00)
  today.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return dt.getTime() <= today.getTime();
}

function isValidISODate(s: string): boolean {
  return parseISODateYYYYMMDD(s) !== null;
}

const AudienceForm = ({ isDialogOpen, onOpenChange }: AudienceFormProps) => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [submitting, setSubmitting] = useState(false);

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
      date: s.date,
      error: null,
    }));
  }

  const handleAddAudience = async () => {
    const name = newAudience.name.trim();
    const file = newAudience.file;
    const date = newAudience.date;
    const clientId = clientDetail?.id;
    if (!clientId) {
      setNewAudience((s) => ({
        ...s,
        error: "No hay cliente activo.",
      }));
      return;
    }
    if (!name || !file || !date) {
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

    if (!isValidISODate(date)) {
      setNewAudience((s) => ({
        ...s,
        error: "Ingresá una fecha válida (YYYY-MM-DD).",
      }));
      return;
    }

    if (!isPastOrToday(date)) {
      setNewAudience((s) => ({ ...s, error: "La fecha no puede ser futura." }));
      return;
    }

    setSubmitting(true);

    // Armá el FormData para tu API
    const form = new FormData();
    form.append("name", name);
    form.append("file", file);
    form.append("date", date);
    form.append("clientId", clientId);

    try {
      await createAudience(form, clientItemId!);

      await fetchAudiencesByClientItemId(clientItemId!);

      onOpenChange(false);
      setNewAudience({
        name: "",
        file: null,
        date: "",
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
    !newAudience.name.trim() || !newAudience.file || !newAudience.date;

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

            {/* Fecha */}
            <div className="grid gap-2">
              <Label htmlFor="audience-date">Fecha de la audiencia</Label>
              <Input
                id="audience-date"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)} // evita fechas futuras si lo querés así
                value={newAudience.date}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewAudience((s) => ({
                    ...s,
                    date: v,
                    error: s.error && isValidISODate(v) ? null : s.error,
                  }));
                }}
              />
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
