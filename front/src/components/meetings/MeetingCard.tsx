import type { Meeting } from "@/types/Meeting";
import { ChevronRight, Trash2, User, AlertTriangle } from "lucide-react";
import googleLogo from "@/assets/logos/cromoVerde.png";
import { formatDateWeekdayShort, formatTimeChile } from "@/lib/formatDate";

interface MeetingCardProps {
  m: Meeting;
  togglePanel: (id: string) => void;
  openId?: string | null;
  onDelete?: (m: Meeting) => void;
  deleting?: boolean;
}

const MeetingCard = ({
  m,
  togglePanel,
  openId,
  onDelete,
  deleting,
}: MeetingCardProps) => {
  const canDelete = m.status === "completed" || m.status === "canceled";

  const isOverdue =
    m.status === "scheduled" &&
    m.startAt &&
    Number.isFinite(Date.parse(m.startAt)) &&
    Date.parse(m.startAt) < Date.now();

  return (
    <li key={m.id} className="p-4">
      {/* fila */}
      <div className="flex items-center gap-4">
        {/* fecha */}
        <div className="w-24 shrink-0 text-gray-500 flex flex-col items-center">
          <span className="text-sm font-medium">
            {`${formatDateWeekdayShort(m.startAt)}.`}
          </span>
          <span className="text-sm font-medium">
            {formatTimeChile(m.startAt)}
          </span>
        </div>

        {/* contenido */}
        <div className="min-w-0 flex-1 pl-3">
          <p className="truncate font-semibold text-lg text-gray-900 mb-1 flex items-center gap-2">
            {m.name}
            {isOverdue && (
              <span
                className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium
                 border-[hsl(0,70%,70%)] bg-[hsl(0,70%,98%)] text-[hsl(0,70%,35%)]"
                title="La reunión está vencida"
                aria-label="Reunión vencida"
              >
                <AlertTriangle className="h-3 w-3" />
                Vencida
              </span>
            )}
          </p>
          <div className="text-[0.9rem] text-gray-900 flex items-center gap-x-2">
            {m.type === "google-meet" ? (
              <>
                <img
                  src={googleLogo}
                  alt="Logo Google"
                  className="h-[1.2rem] w-[1.2rem]"
                />
                <span className="font-medium">Google Meet</span>
              </>
            ) : (
              <>
                <User />
                <span className="font-medium">Presencial</span>
              </>
            )}
          </div>
        </div>

        {/* arrow */}
        <div className="pr-2 flex items-center gap-2">
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // no abrir el panel por error
                if (!deleting) onDelete?.(m);
              }}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[0.85rem]
                          ${
                            deleting
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-[hsl(0,70%,97%)]"
                          }
                          border-[hsl(0,70%,70%)] text-[hsl(0,70%,40%)]`}
              aria-label="Eliminar reunión"
              disabled={deleting}
              title={deleting ? "Eliminando..." : "Eliminar reunión"}
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          )}

          <button
            className="cursor-pointer"
            onClick={() => togglePanel(m.id ?? "")}
            aria-expanded={openId === m.id}
            aria-controls="meeting-detail-panel"
            title="Ver detalles"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </li>
  );
};

export default MeetingCard;
