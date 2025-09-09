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
import { useRef, useState } from "react";

type DocumentFormProps = {
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void; // <— firma exacta que pide Dialog
};

type NewDocument = {
  name: string;
  file: File | null;
};

const initialItemState: NewDocument = {
  name: "",
  file: null,
};

const DocumentForm = ({ isDialogOpen, onOpenChange }: DocumentFormProps) => {
  const [newDocument, setNewDocument] = useState<NewDocument>(initialItemState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  const handleAddDocument = () => {};

  const fileInputId = "document-file-input";
  const accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg"; // ajustá según tu proyecto
  const maxSizeMB = 15; // ejemplo

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setNewDocument(initialItemState);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Documento</DialogTitle>
          <DialogDescription>
            Complete los detalles del documento para comenzar a trabajar en
            ello.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Nombre del docuemnto</Label>
            <Input
              required
              id="description"
              value={newDocument.name}
              onChange={(e) =>
                setNewDocument({
                  ...newDocument,
                  name: e.target.value,
                })
              }
              placeholder="" //Consultar preferencias
            />
          </div>
        </div>
        {/* si hay archivo, mostramos “estado cargado”; si no, el dropzone */}
        {newDocument.file ? (
          <div className="mt-2 border rounded-lg p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {newDocument.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {newDocument.file.type || "archivo"} ·{" "}
                {formatBytes(newDocument.file.size)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Cambiar → abre el input oculto */}
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                Cambiar
              </Button>

              {/* Quitar → limpia el archivo (dejamos el nombre como lo haya editado el usuario) */}
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setNewDocument((s) => ({ ...s, file: null }));
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
                setNewDocument((s) => ({
                  ...s,
                  error: `El archivo supera ${maxSizeMB}MB.`,
                  file: null,
                }));
                return;
              }
              setNewDocument((s) => ({
                ...s,
                file: f,
                error: null,
              }));
            }}
            onClick={() => document.getElementById(fileInputId)?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                document.getElementById(fileInputId)?.click();
              }
            }}
          >
            <p className="text-sm text-gray-600">
              Arrastrá el archivo aquí o{" "}
              <span className="underline">hacé click</span> para seleccionarlo
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Formatos permitidos: {accept}
            </p>
          </div>
        )}
        <input
          id={fileInputId}
          ref={fileInputRef}
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
              setNewDocument((s) => ({
                ...s,
                error: `El archivo supera ${maxSizeMB}MB.`,
                file: null,
              }));
              return;
            }
            setNewDocument((s) => ({
              ...s,
              file: f,
              error: null,
            }));
          }}
        />
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleAddDocument}
            disabled={!newDocument.name.trim() || !newDocument.file}
          >
            Agregar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentForm;
