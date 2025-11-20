// src/components/documents/DocumentCard.tsx
import { Ellipsis, FileIcon } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdownMenu";
import type { Document } from "@/types/Document";
import { formatDateChileNumeric } from "@/lib/formatDate";
import { useLawyerStore } from "@/store/useLawyerStore";

interface DocumentCardProps {
  doc: Document;
  openInViewer: (docs: Document[], activeId?: string) => void;
  onEdit?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  onShowVersions?: (doc: Document) => void;
  deleting?: boolean;
}

const DocumentCard = ({
  doc,
  openInViewer,
  onEdit,
  onDelete,
  onShowVersions,
  deleting,
}: DocumentCardProps) => {
  const currentLawyerId = useLawyerStore((s) => s.lawyer?.id);
  console.log(doc);

  // Helper: size robusto (usa doc.size o la primera version)
  function getSize(): number {
    const s = (doc as any).size ?? (doc as any).versions?.[0]?.size ?? 0;
    return typeof s === "number" ? s : Number(s) || 0;
  }

  function formatSize(bytes: number): string {
    if (!bytes && bytes !== 0) return "—";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Helper: createdAt robusto (doc.createdAt puede ser string ISO)
  function getCreatedAt(): Date | null {
    const v = (doc as any).createdAt ?? (doc as any).versions?.[0]?.createdAt;
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  // Helper: mime / tipo (priorizar doc.type, sino version.mimeType)
  function isPdf(): boolean {
    const t = (doc as any).type ?? (doc as any).versions?.[0]?.mimeType ?? "";
    return String(t).toLowerCase().includes("pdf");
  }

  // Helper: fileUrl robusto (doc.fileUrl o version.fileUrl)
  function getFileUrl(): string | undefined {
    return (
      (doc as any).fileUrl ?? (doc as any).versions?.[0]?.fileUrl ?? undefined
    );
  }

  const size = getSize();
  const createdAtDate = getCreatedAt();
  const fileUrl = getFileUrl();
  const docToOpen = { ...doc, size, createdAtDate, fileUrl };

  // ====== NUEVO: determinar última versión / badge / date / lawyer ======
  const versions = Array.isArray((doc as any).versions)
    ? (doc as any).versions
    : [];
  const lastVersion = versions.length
    ? versions.reduce((a: any, b: any) => {
        const av = Number(a?.versionNumber ?? 0);
        const bv = Number(b?.versionNumber ?? 0);
        return bv > av ? b : a;
      })
    : undefined;

  const badgeNumber = doc.currentVersion ?? lastVersion?.versionNumber ?? 1;
  const displaySize = doc.size ?? lastVersion?.size ?? 0;
  const displayDate =
    lastVersion?.createdAt ?? doc.updatedAt ?? doc.createdAt ?? null;

  // nombre del abogado que subió la última versión:
  // backend puede devolver `lastVersion.lawyer` (obj) o `lastVersion.uploadedBy` (uuid)
  const lastLawyerObj = lastVersion?.lawyer ?? null;
  const uploadedById = lastVersion?.uploadedBy ?? null;

  // Lógica corregida y legible:
  let uploaderLabel = "—";

  if (lastLawyerObj) {
    // CASO 1: Tenemos el objeto abogado completo
    if (lastLawyerObj.id === currentLawyerId) {
      uploaderLabel = "Tu";
    } else {
      const fullName = `${lastLawyerObj.firstName ?? ""} ${
        lastLawyerObj.lastName ?? ""
      }`.trim();
      // Si tiene nombre, usalo. Si no, usá el ID cortado.
      uploaderLabel =
        fullName ||
        (uploadedById ? String(uploadedById).slice(0, 8) : "Desconocido");
    }
  } else if (uploadedById) {
    // CASO 2: Solo tenemos el ID (fallback raro, pero posible)
    if (uploadedById === currentLawyerId) {
      uploaderLabel = "Tu";
    } else {
      uploaderLabel = `ID ${String(uploadedById).slice(0, 8)}`;
    }
  }

  return (
    <li key={doc.id} className="p-4">
      {/* fila */}
      <div className="flex items-center gap-4">
        {/* ícono */}
        <div className="shrink-0">
          <FileIcon />
        </div>

        {/* contenido */}
        <div className="min-w-0 flex-1">
          <div className=" text-[0.9rem] text-gray-500 grid items-center grid-cols-[18rem_10rem_15rem] gap-x-6">
            <div>
              <p className="text-base font-medium text-gray-900 capitalize mb-1 flex items-center gap-2">
                {doc.name}
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                  v{badgeNumber}
                </span>
              </p>

              <div className="text-xs text-gray-500">
                {displayDate ? formatDateChileNumeric(displayDate) : "Fecha —"}
              </div>
            </div>

            <span className="justify-self-center tabular-nums">
              {formatSize(displaySize)}
            </span>
            <span className="justify-self-end tabular-nums">
              {/* {`Subido por: ${uploaderLabel}`} */}
              {uploaderLabel}
            </span>
          </div>
        </div>

        {/* acciones */}
        <div className="flex items-center gap-2 gap-x-4">
          <button
            disabled={deleting}
            onClick={() => {
              if (isPdf()) {
                openInViewer([docToOpen], doc.id);
              } else {
                window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
              }
            }}
            className={`text-blue-700 ${
              deleting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {deleting ? "Eliminando..." : "Ver"}
          </button>

          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Opciones del ítem"
                className="p-1.5 rounded-md hover:bg-gray-100 leading-none"
                disabled={deleting}
              >
                <Ellipsis className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              size="1"
              variant="soft"
              align="end"
              sideOffset={6}
            >
              <DropdownMenuItem
                onSelect={() => {
                  if (isPdf()) {
                    openInViewer([docToOpen], doc.id);
                  } else {
                    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                shortcut="Enter"
              >
                Ver detalles
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => onEdit?.(doc)} shortcut="⌘ E">
                Editar
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => {
                  onShowVersions?.(doc);
                }}
              >
                Versiones
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  if (deleting) return;
                  onDelete?.(doc);
                }}
                color="crimson"
                shortcut="⌘ ⌫"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </div>
      </div>
    </li>
  );
};

export default DocumentCard;
