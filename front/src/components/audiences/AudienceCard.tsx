import { Ellipsis, ScrollText } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdownMenu";
import type { Audience } from "@/types/Audience";

interface AudienceCardProps {
  aud: Audience;
  openInViewer: (audiences: Audience[], activeId?: string) => void;
  onDelete?: (aud: Audience) => void;
  onEdit?: (aud: Audience) => void; // 👈 nueva
  deleting?: boolean;
}

const AudienceCard = ({
  aud,
  openInViewer,
  onDelete,
  onEdit,
  deleting,
}: AudienceCardProps) => {
  function formatDate(isoDate: string | null): string {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }
  return (
    <li key={aud.id} className="p-4">
      {/* fila */}
      <div className="flex items-center gap-4">
        {/* ícono */}
        <div className="shrink-0">
          <ScrollText />
        </div>

        {/* contenido */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900 mb-1">{aud.name}</p>
          <p className=" text-[0.9rem] text-gray-500 grid items-center grid-cols-[15rem_10rem] gap-x-6">
            <span className="justify-self-start tabular-nums">
              {`${aud.pages} paginas`}
            </span>
            <span className="justify-self-end tabular-nums">
              {formatDate(aud.date ?? null)}
            </span>
          </p>
        </div>

        {/* acciones */}
        <div className="flex items-center gap-2 gap-x-4">
          <button
            onClick={() => openInViewer([aud], aud.id)}
            className={`text-blue-700 ${
              deleting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={deleting}
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
                onSelect={() => openInViewer([aud], aud.id)}
                shortcut="Enter"
              >
                Ver detalles
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => onEdit?.(aud)} // 👈 dispara el modal arriba
                shortcut="⌘ E"
              >
                Editar
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  if (deleting) return;
                  onDelete?.(aud);
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

export default AudienceCard;
