// src/components/meetings/MeetingDetailPanel.tsx
import { Button } from "@/components/ui/button";
import { User as UserIcon } from "lucide-react";
import googleLogo from "@/assets/logos/cromoVerde.png";
import type { Meeting } from "@/types/Meeting";
import { useJoinMeeting } from "@/hooks/useJoinMeeting";
import { formatDateWeekdayShort, formatTimeChile } from "@/lib/formatDate";

type MeetingDetailPanelProps = {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  lawyerFullName?: string;
  lawyerEmail?: string;
  onEdit?: (m: Meeting) => void;
  onCancel?: (m: Meeting) => void;
  canceling?: boolean;
  onComplete?: (m: Meeting) => void;
  completing?: boolean;
  onManualTime?: (m: Meeting) => void;
};

export default function MeetingDetailPanel({
  meeting,
  isOpen,
  onClose,
  lawyerFullName,
  lawyerEmail,
  onEdit,
  onCancel,
  canceling = false,
  onComplete,
  completing = false,
  onManualTime,
}: MeetingDetailPanelProps) {
  const open = Boolean(meeting) && isOpen;

  // 👇 NUEVO: preparar acciones para la reunión (si tiene link)
  const link = meeting?.link ?? null;
  const {
    disabled: joinDisabled,
    join,
    copy,
  } = useJoinMeeting(link, {
    onInvalidUrl: () => console.warn("Enlace de reunión inválido."),
    onOpenError: () => console.error("No se pudo abrir el enlace."),
    onOpened: () => console.log("Abriendo reunión en el navegador…"),
  });

  const isCompleted = meeting?.status === "completed";
  const hasLink = Boolean(meeting?.link);

  const startMs = meeting ? Date.parse(meeting.startAt) : NaN;
  const hasStarted = Number.isFinite(startMs) && Date.now() >= startMs; // ya empezó / pasó

  const canCancel = meeting?.status === "scheduled" && !hasStarted; // solo si es futura

  const canMarkCompleted =
    meeting?.status === "scheduled" &&
    Date.now() >= Date.parse(meeting.startAt);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[998] bg-black/30 rounded-sm backdrop-blur-[1px] transition-opacity duration-300 ease-in-out
        ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden={open ? "false" : "true"}
      />

      {/* Panel deslizante */}
      <aside
        className={`fixed z-[999] top-0 right-0 h-dvh w-full md:w-[380px]
        bg-white border-l border-gray-200 
        transform transition-transform duration-300 ease-in-out will-change-transform
        ${open ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label="Detalle de reunión"
      >
        {/* Header */}
        <div className="px-5 pt-4 border-b border-gray-200 flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {meeting?.name ?? "Reunión"}
            </h2>
            {meeting && (
              <p className="pt-1 pb-4 text-sm text-gray-600">
                {formatDateWeekdayShort(meeting.startAt)} ·{" "}
                {formatTimeChile(meeting.startAt)}
              </p>
            )}
          </div>
          <button
            className="ml-3 text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 h-[calc(100%-56px)] overflow-y-auto scrollbar-none">
          {meeting && (
            <>
              {/* Tipo / ubicación / link */}
              <div className="text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  {meeting.type === "google-meet" ? (
                    <>
                      <img src={googleLogo} alt="Google" className="h-4 w-4" />
                      <span className="font-medium">Google Meet</span>
                    </>
                  ) : (
                    <>
                      <UserIcon className="h-4 w-4" />
                      <span className="font-medium">Presencial</span>
                    </>
                  )}
                </div>

                {/* 👇 CAMBIO: mostramos el link como texto y damos acciones controladas */}
                {meeting.link && (
                  <div className="pt-2 break-all text-gray-800">
                    {meeting.link}
                  </div>
                )}

                {meeting.location && (
                  <p className="pt-2">📍 {meeting.location}</p>
                )}
              </div>

              {/* Participantes */}
              <div>
                <p className="text-sm font-medium text-gray-900 pb-2">
                  Participantes
                </p>
                <ul className="flex flex-col gap-y-1">
                  {meeting.participants.map((p) => (
                    <li key={p.email} className="text-sm text-gray-700">
                      {p.name ? `${p.name} · ` : ""}
                      {p.email}
                    </li>
                  ))}
                  {(lawyerFullName || lawyerEmail) && (
                    <li className="text-sm text-gray-700">
                      {lawyerFullName ? `${lawyerFullName} · ` : ""}
                      {lawyerEmail ?? ""}
                    </li>
                  )}
                </ul>
              </div>

              {/* Notas */}
              {meeting.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-900 pb-1">
                    Notas internas
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {meeting.notes}
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="pt-2 flex flex-wrap gap-2">
                {/* 👇 NUEVO: Unirse y Copiar comparten la misma lógica */}
                {!isCompleted && hasLink && (
                  <>
                    <Button
                      className="bg-blue-800 text-white"
                      disabled={joinDisabled}
                      onClick={join}
                      title={
                        joinDisabled
                          ? "Sin enlace válido"
                          : "Unirse a la reunión"
                      }
                    >
                      Unirse
                    </Button>

                    <Button
                      variant="outline"
                      className="border-gray-300"
                      disabled={joinDisabled}
                      onClick={copy}
                      title={
                        joinDisabled ? "Sin enlace válido" : "Copiar enlace"
                      }
                    >
                      Copiar enlace
                    </Button>
                  </>
                )}

                <div className="flex-1" />
                {!isCompleted && (
                  <>
                    <Button
                      className="bg-blue-800"
                      onClick={() => meeting && onEdit?.(meeting)}
                    >
                      Editar
                    </Button>

                    {canCancel && (
                      <Button
                        variant="outline"
                        className="border-gray-300"
                        onClick={() => meeting && onCancel?.(meeting)}
                        disabled={!meeting || canceling}
                        title={canceling ? "Cancelando..." : "Cancelar reunión"}
                      >
                        {canceling ? "Cancelando..." : "Cancelar reunión"}
                      </Button>
                    )}
                  </>
                )}

                <Button
                  className="bg-[hsl(210,90%,40%)]"
                  onClick={() => meeting && onComplete?.(meeting)}
                  disabled={!canMarkCompleted || !!completing}
                  title={
                    !canMarkCompleted
                      ? "Disponible al llegar la hora de inicio"
                      : completing
                      ? "Finalizando..."
                      : "Marcar como finalizada"
                  }
                >
                  {completing ? "Finalizando..." : "Finalizar reunión"}
                </Button>

                {meeting?.status === "completed" && (
                  <Button
                    variant="outline"
                    className="border-gray-300"
                    onClick={() => meeting && onManualTime?.(meeting)}
                    title="Cargar tiempo manual"
                  >
                    Cargar tiempo
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
