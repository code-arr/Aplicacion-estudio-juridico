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

interface DocumentCardProps {
  doc: Document;
  openInViewer: (docs: Document[], activeId?: string) => void;
  onDelete?: (doc: Document) => void;
  deleting?: boolean;
}

const DocumentCard = ({
  doc,
  openInViewer,
  onDelete,
  deleting,
}: DocumentCardProps) => {
  function formatSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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
            <p className="text-base font-medium text-gray-900 capitalize mb-1">
              {doc.name}
            </p>
            <span className="justify-self-center tabular-nums">
              {formatSize(doc.size)}
            </span>
            <span className="justify-self-end tabular-nums">
              {formatDateChileNumeric(doc.createdAt!)}
            </span>
          </div>
        </div>

        {/* acciones */}
        <div className="flex items-center gap-2 gap-x-4">
          <button
            disabled={deleting}
            onClick={() => {
              if ((doc.type || "").toLowerCase() === "pdf") {
                openInViewer([doc], doc.id);
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
                  if ((doc.type || "").toLowerCase() === "pdf") {
                    openInViewer([doc], doc.id); // abre si no existe, agrega si ya está abierto
                  } else {
                    // Otros tipos, por ahora, abrir/descargar directo
                    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                shortcut="Enter"
              >
                Ver detalles
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => {
                  // Abrí tu modal de edición o navegá a la ruta de edición
                  // openEditModal(item.id) / navigate(...)
                }}
                shortcut="⌘ E"
              >
                Editar
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  if (deleting) return;
                  onDelete?.(doc); // <- ahora pasás el doc completo
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
