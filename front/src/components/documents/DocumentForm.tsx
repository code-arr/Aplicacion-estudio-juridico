import { createDocument } from "@/api/document";
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
import { useClientStore } from "@/store/useClientStore";
import { useDocumentStore } from "@/store/useDocumentStore";
import { use, useRef, useState } from "react";
import { useParams } from "react-router-dom";

type DocumentFormProps = {
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void; // <— firma exacta que pide Dialog
};

type NewDocument = {
  name: string;
  file: File | null;
  error?: string | null;
};

const initialItemState: NewDocument = {
  name: "",
  file: null,
  error: null,
};

const ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg"; // ajustá según tu proyecto
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
  const allowedExt = new Set(["pdf", "doc", "docx", "png", "jpg", "jpeg"]);
  const extMatch = file.name.toLowerCase().match(/\.([a-z0-9]+)$/i);
  if (!extMatch) return false;
  const ext = extMatch[1];
  return allowedExt.has(ext);
}

const DocumentForm = ({ isDialogOpen, onOpenChange }: DocumentFormProps) => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [submitting, setSubmitting] = useState(false);

  const clientDetail = useClientStore((s) => s.clientDetail);

  const fetchDocumentsByClientItemId = useDocumentStore(
    (s) => s.fetchDocumentsByClientItemId
  );

  const [newDocument, setNewDocument] = useState<NewDocument>(initialItemState);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(file: File | null) {
    if (!file) return;

    // Valida tamaño
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setNewDocument((s) => ({
        ...s,
        error: `El archivo supera ${MAX_SIZE_MB}MB.`,
        file: null,
      }));
      return;
    }
    // Valida tipo
    if (!isAllowedType(file)) {
      setNewDocument((s) => ({
        ...s,
        error:
          "Tipo de archivo no permitido. Usá PDF, DOC, DOCX, PNG, JPG o JPEG.",
        file: null,
      }));
      return;
    }

    // Autocompletar nombre si está vacío
    /* const baseName = file.name.replace(/\.[^.]+$/, ""); */

    setNewDocument((s) => ({
      ...s,
      file,
      name: s.name,
      error: null,
    }));
  }

  async function handleAddDocument() {
    const name = newDocument.name.trim();
    const file = newDocument.file;
    const clientId = clientDetail?.id;
    if (!clientId) {
      setNewDocument((s) => ({
        ...s,
        error: "No hay cliente activo.",
      }));
      return;
    }
    if (!name || !file) {
      setNewDocument((s) => ({
        ...s,
        error: "Completá el nombre y seleccioná un archivo.",
      }));
      return;
    }

    setSubmitting(true);

    // Armá el FormData para tu API
    const form = new FormData();
    form.append("name", name);
    form.append("file", file);
    form.append("clientId", clientId);

    try {
      await createDocument(form, clientItemId!);

      await fetchDocumentsByClientItemId(clientItemId!);

      onOpenChange(false);
      setNewDocument({
        name: "",
        file: null,
        error: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setNewDocument((s) => ({
        ...s,
        error:
          err?.message ??
          "No se pudo subir el documento. Intentá de nuevo más tarde.",
      }));
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled = !newDocument.name.trim() || !newDocument.file;

  const fileInputId = "document-file-input";

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setNewDocument({ name: "", file: null, error: null });
          if (fileInputRef.current) fileInputRef.current.value = "";
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddDocument();
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del docuemnto</Label>
              <Input
                required
                id="name"
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
                  onClick={pickFile}
                  /* onClick={() => document.getElementById(fileInputId)?.click()} */
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
                handleFileSelected(f);
              }}
              onClick={pickFile}
              /* onClick={() => document.getElementById(fileInputId)?.click()} */
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  /* document.getElementById(fileInputId)?.click(); */
                  pickFile();
                }
              }}
            >
              <p className="text-sm text-gray-600">
                Arrastrá el archivo aquí o{" "}
                <span className="underline">hacé click</span> para seleccionarlo
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Formatos permitidos: {ACCEPT}
              </p>
            </div>
          )}

          {newDocument.error && (
            <p className="mt-2 text-sm text-red-600" aria-live="polite">
              {newDocument.error}
            </p>
          )}

          <input
            id={fileInputId}
            ref={fileInputRef}
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
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isDisabled || submitting}>
              {submitting ? "Subiendo..." : "Agregar Documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentForm;
