// src/components/meetings/LawyerUpcomingMeetings.tsx
import { useEffect, useMemo } from "react";
import type { Meeting } from "@/types/Meeting";
import { useMeetingStore } from "@/store/useMeetingStore";
import { useToast } from "@/hooks/useToast";
import { isSafeMeetingUrl } from "@/lib/urls";
import googleLogo from "@/assets/logos/google.png";
import { formatDateChileShort } from "@/lib/formatDate"; // opcional, si lo tenés

type Props = {
  onOpen?: (m: Meeting) => void; // callback opcional cuando se hace click en una reunión online
  collapsed?: boolean; // para ajustar UI cuando la sidebar está colapsada
};

const LawyerUpcomingMeetings = ({ onOpen, collapsed }: Props) => {
  const { toast } = useToast?.() ?? { toast: () => {} };

  const fetchMeetingsByLawyer = useMeetingStore((s) => s.fetchMeetingsByLawyer);
  const meetingsByLawyer = useMeetingStore((s) => s.meetingsByLawyer ?? []);

  useEffect(() => {
    if (typeof fetchMeetingsByLawyer === "function") {
      fetchMeetingsByLawyer().catch(() => {
        // log por si hace falta debug
        console.warn("fetchMeetingsByLawyer failed", e);
      });
    }
  }, [fetchMeetingsByLawyer]);

  // Filtrar sólo futuras y ordenar
  const upcoming = useMemo(() => {
    const now = Date.now();
    return (meetingsByLawyer ?? [])
      .filter((m) => {
        if (!m?.startAt) return false;
        const t = new Date(m.startAt).getTime();
        return !Number.isNaN(t) && t >= now;
      })
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )
      .slice(0, 5);
  }, [meetingsByLawyer]);

  const handleClick = async (m: Meeting) => {
    const link = m?.link ?? null;
    const hasOnline = !!link && isSafeMeetingUrl(link);
    if (!hasOnline) {
      // Si no es online avisamos y nada más
      toast?.({
        title: "Reunión presencial",
        description: m.location
          ? `Lugar: ${m.location}`
          : "Reunión sin enlace online.",
      });
      return;
    }

    try {
      const ok = await window.api.openExternal(link!.trim());
      if (!ok) {
        toast?.({
          variant: "destructive",
          title: "No se pudo abrir",
          description:
            "Hubo un problema abriendo el enlace. Intentá copiarlo manualmente.",
        });
      } else {
        onOpen?.(m);
      }
    } catch (e) {
      toast?.({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al intentar abrir la reunión.",
      });
    }
  };

  if (!upcoming.length) {
    return (
      <div className={`px-3 py-2 ${collapsed ? "text-xs" : "text-sm"}`}>
        <p className="text-[hsl(210,40%,98%)]/70">No hay reuniones próximas</p>
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      <h4
        className={`px-2 mb-2 ${
          collapsed ? "text-xs" : "text-sm"
        } text-[hsl(210,40%,98%)]/70`}
      >
        Próximas
      </h4>

      <div className="flex flex-col gap-2">
        {upcoming.map((m) => {
          const d = new Date(m.startAt);
          const time = d.toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const title = m.name || "Reunión sin título";
          const hasOnline = !!m.link && isSafeMeetingUrl(m.link);
          const clientName = m.participants[0].name || "Cliente desconocido";

          return (
            <button
              key={m.id}
              onClick={() => handleClick(m)}
              disabled={!hasOnline && !m.location}
              title={
                hasOnline
                  ? "Unirse (online)"
                  : m.location
                  ? `Presencial: ${m.location}`
                  : "Sin detalles"
              }
              className={`w-full text-left rounded-md px-2 py-1 transition-colors flex items-center justify-between ${
                hasOnline
                  ? "hover:bg-[hsl(216,12%,15%)]/40 cursor-pointer"
                  : "cursor-default"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div
                  className={`truncate ${
                    collapsed ? "text-xs" : "text-sm"
                  } font-medium text-[hsl(210,40%,98%)]`}
                >
                  {title}
                </div>
                <div
                  className={`text-[0.67rem] ${
                    collapsed ? "text-[0.55rem]" : "text-xs"
                  } text-[hsl(210,40%,98%)]/70`}
                >
                  {clientName} ·{" "}
                  {d
                    .toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                    })
                    .replace(".", "")}{" "}
                  · {time}
                </div>
              </div>

              {hasOnline ? (
                <img
                  src={googleLogo}
                  className="w-4 h-4 ml-2 flex-shrink-0"
                  alt="Meet"
                />
              ) : (
                <div className="text-[0.65rem] text-[hsl(210,40%,98%)]/60 ml-2">
                  {m.location ? "Pres." : "—"}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LawyerUpcomingMeetings;
