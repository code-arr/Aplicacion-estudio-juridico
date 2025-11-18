import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, DownloadCloud } from "lucide-react";
import type { Document as AppDocument } from "@/types/Document";
import type { DocumentVersion } from "@/types/Document";
import { getVersionsByDocumentId, deleteVersion } from "@/api/document";

type Props = {
  open: boolean;
  document: AppDocument;
  onOpenChange: (v: boolean) => void;
  onUploadNewVersion?: (form: FormData) => Promise<void>;
  canDelete?: boolean;
};

export default function DocumentVersionsModal({
  open,
  document,
  onOpenChange,
  onUploadNewVersion,
  canDelete = true,
}: Props) {
  const [versions, setVersions] = React.useState<DocumentVersion[] | null>(
    null
  );
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    getVersionsByDocumentId(document.id)
      .then((v) => mounted && setVersions(v))
      .catch(() => mounted && setVersions([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [open, document.id]);

  const safeOpenUrl = (raw?: string | null) => {
    if (!raw) return;
    const encoded = encodeURI(raw);
    // abrir en nueva ventana
    window.open(encoded, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (v: DocumentVersion) => {
    const url =
      (v as any).fileUrl ??
      // fallback: a veces tu Document tiene fileUrl en la entidad padre
      (document.fileUrl as string | undefined) ??
      null;
    if (!url) return alert("No hay URL disponible para esta versión.");
    safeOpenUrl(url);
  };

  const handleDelete = async (v: DocumentVersion) => {
    if (!canDelete) return alert("No tenés permiso para borrar versiones.");
    if (!confirm(`¿Borrar versión ${v.versionNumber} de "${document.name}"?`))
      return;
    try {
      await deleteVersion(document.id, v.id);
      setVersions((s) => s?.filter((x) => x.id !== v.id) ?? null);
    } catch (err) {
      console.error(err);
      alert("No se pudo borrar la versión. Intentá de nuevo.");
    }
  };

  const handleFileInput = async (f?: File | null) => {
    if (!f) return;
    if (!onUploadNewVersion) {
      return alert(
        "No está habilitado subir versiones desde este modal (falta handler)."
      );
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("name", document.name);
    fd.append("file", f);
    fd.append("clientId", document.clientId);
    try {
      await onUploadNewVersion(fd);
      const v = await getVersionsByDocumentId(document.id);
      setVersions(v);
    } catch (err) {
      console.error(err);
      alert("No se pudo subir la nueva versión.");
    } finally {
      setUploading(false);
    }
  };

  // helper: formatea tamaño legible
  const formatSize = (n?: number | null) => {
    if (!n) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(n) / Math.log(k));
    return `${(n / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogTitle className="flex items-center justify-between gap-4 pt-3">
          <span>Versiones — {document.name}</span>
          <span className="text-sm text-gray-500">
            v{document.currentVersion ?? 0}
          </span>
        </DialogTitle>

        <div className="mt-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              Cargando versiones…
            </div>
          ) : (versions ?? []).length === 0 ? (
            <div className="py-6 text-center text-gray-600">
              No hay versiones
            </div>
          ) : (
            <ul className="space-y-2">
              {(versions ?? [])
                .slice()
                .sort((a, b) => b.versionNumber - a.versionNumber)
                .map((v) => {
                  // Aquí la corrección: el backend está devolviendo `lawyer` (objeto)
                  // No confiar en `uploadedBy` como objeto.
                  const lawyerObj = (v as any).lawyer ?? null;
                  const uploaderName =
                    lawyerObj && (lawyerObj.firstName || lawyerObj.lastName)
                      ? `${lawyerObj.firstName ?? ""} ${
                          lawyerObj.lastName ?? ""
                        }`.trim()
                      : // fallback: si backend solo devolvió uploadedBy como string (uuid)
                      (v.uploadedBy as unknown as string)
                      ? String(v.uploadedBy).slice(0, 8)
                      : "Desconocido";

                  const when = v.createdAt ? new Date(v.createdAt) : null;
                  const fileUrl =
                    (v as any).fileUrl ?? document.fileUrl ?? null;
                  const mime = (v as any).mimeType ?? null;
                  const size = (v as any).size ?? null;

                  return (
                    <li
                      key={v.id}
                      className="flex items-center justify-between border rounded p-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">
                          Versión {v.versionNumber}
                          {document.currentVersion === v.versionNumber && (
                            <span className="ml-2 inline-block text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Activa
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600">
                          {when ? when.toLocaleString() : "Fecha —"} ·{" "}
                          {uploaderName} {mime ? <>· {mime}</> : null}{" "}
                          {size ? <>· {formatSize(Number(size))}</> : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(v)}
                          disabled={!fileUrl}
                        >
                          <DownloadCloud className="w-4 h-4 mr-2" />
                          Ver
                        </Button>

                        <label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) =>
                              handleFileInput(e.target.files?.[0] ?? null)
                            }
                          />
                          <Button size="sm" variant="ghost">
                            Reemplazar
                          </Button>
                        </label>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(v)}
                          disabled={!canDelete}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Borrar
                        </Button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFileInput(e.target.files?.[0] ?? null)}
            />
            <Button>{uploading ? "Subiendo..." : "Subir nueva versión"}</Button>
          </label>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
