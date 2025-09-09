import { useRef, useState } from "react";
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

const AudienceForm = ({ isDialogOpen, onOpenChange }: AudienceFormProps) => {
  const [newAudience, setNewAudience] = useState<NewAudience>(initialItemState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileInputId = "audience-file-input";
  const accept = ".pdf";
  const maxSizeMB = 15;

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  async function handleFileSelected(f: File | null) {
    /*     if (!f) return;

    if (f.size > maxSizeMB * 1024 * 1024) {
      setNewAudience((s) => ({
        ...s,
        error: `El archivo supera ${maxSizeMB}MB.`,
        file: null,
      }));
      return;
    }
    // Sólo PDF (por UX y porque las audiencias son PDFs)
    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setNewAudience((s) => ({
        ...s,
        error: "El archivo debe ser un PDF.",
        file: null,
      }));
      return;
    }

    setNewAudience((s) => ({
      ...s,
      file: f,
      error: null,
      name: s.name || f.name.replace(/\.[^/.]+$/, ""),
    })); */
  }

  const handleSubmit = async () => {
    /*     if (!newAudience.name.trim() || !newAudience.file || !newAudience.date)
      return;

    // TODO: enviar a tu API. Ejemplo:
    // await audienceService.create({ name: newAudience.name, date: newAudience.date, file: newAudience.file })
    try {
      if (onCreate) {
        await onCreate({
          name: newAudience.name.trim(),
          date: newAudience.date,
          file: newAudience.file,
        });
      }
      setIsDialogOpen(false);
      setNewAudience(initialItemState);
    } catch (e) {
      setNewAudience((s) => ({
        ...s,
        error: "No se pudo crear la audiencia. Intente nuevamente.",
      }));
    } */
  };

  const isDisabled =
    !newAudience.name.trim() || !newAudience.file || !newAudience.date;

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

        <div className="grid gap-4 py-4">
          {/* Nombre */}
          <div className="grid gap-2">
            <Label htmlFor="audience-name">Nombre de la audiencia</Label>
            <Input
              id="audience-name"
              required
              value={newAudience.name}
              onChange={(e) =>
                setNewAudience((s) => ({ ...s, name: e.target.value }))
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
              onChange={(e) =>
                setNewAudience((s) => ({ ...s, date: e.target.value }))
              }
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
                  onClick={() => document.getElementById(fileInputId)?.click()}
                >
                  Cambiar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setNewAudience((s) => ({ ...s, file: null, error: null }));
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
                if (f.size > maxSizeMB * 1024 * 1024) {
                  setNewAudience((s) => ({
                    ...s,
                    error: `El archivo supera ${maxSizeMB}MB.`,
                    file: null,
                  }));
                  return;
                }
                setNewAudience((s) => ({
                  ...s,
                  file: f,
                  error: null,
                }));
                /* await handleFileSelected(f); */
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
                <span className="underline">hacé click</span> para seleccionarlo
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Formato permitido: {accept} · Máx. {maxSizeMB}MB
              </p>
              {newAudience.error && (
                <p className="text-xs text-red-600 mt-2">{newAudience.error}</p>
              )}
            </div>
          )}

          <input
            id={fileInputId}
            type="file"
            className="hidden"
            accept={accept}
            onClick={(e) => {
              // esto garantiza que si el usuario elige el mismo archivo A, igual dispare onChange
              (e.currentTarget as HTMLInputElement).value = "";
            }}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (!f) return;
              if (f.size > maxSizeMB * 1024 * 1024) {
                setNewAudience((s) => ({
                  ...s,
                  error: `El archivo supera ${maxSizeMB}MB.`,
                  file: null,
                }));
                return;
              }
              setNewAudience((s) => ({
                ...s,
                file: f,
                error: null,
              }));
              /* await handleFileSelected(f); */
            }}
          />
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isDisabled}>
            Agregar Audiencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AudienceForm;
