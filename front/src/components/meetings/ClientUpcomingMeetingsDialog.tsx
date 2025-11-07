// src/components/meetings/ClientUpcomingMeetingsDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import googleLogo from "@/assets/logos/google.png";
import type { Meeting } from "@/types/Meeting";
import { isSafeMeetingUrl } from "@/lib/urls";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetings: Meeting[]; // ya filtradas (próximas, max 5)
  onJoin: (link?: string | null) => void;
};

const ClientUpcomingMeetingsDialog = ({
  open,
  onOpenChange,
  meetings,
  onJoin,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Próximas reuniones</DialogTitle>
          <DialogDescription>
            Seleccioná una reunión para unirte en Google Meet.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          {meetings.map((m) => {
            const d = new Date(m.startAt);
            const fecha = d.toLocaleDateString("es-CL", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            });
            const hora = d.toLocaleTimeString("es-CL", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            const hasOnlineLink = !!m.link && isSafeMeetingUrl(m.link);
            const isPresencial =
              !hasOnlineLink ||
              (m.type &&
                ["in_person", "presencial", "physical"].includes(
                  String(m.type).toLowerCase()
                ));

            const handleClick = () => {
              if (hasOnlineLink) onJoin(m.link);
            };

            return (
              <button
                key={m.id}
                onClick={handleClick}
                disabled={!hasOnlineLink}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md border text-left
        ${
          hasOnlineLink
            ? "border-gray-200 hover:bg-gray-50 cursor-pointer"
            : "border-gray-100 bg-gray-50 cursor-default"
        }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[hsl(225,15%,15%)]">
                    {m.name || "Reunión sin título"}
                  </p>
                  <p className="text-xs text-[hsl(225,10%,45%)]">
                    {fecha} · {hora}
                  </p>
                  {isPresencial && (
                    <p className="mt-0.5 text-[0.68rem] text-[hsl(225,10%,45%)]">
                      Presencial
                      {m.location ? ` · ${m.location}` : ""}
                    </p>
                  )}
                  {hasOnlineLink && (
                    <p className="mt-0.5 text-[0.68rem] text-[hsl(210,100%,40%)]">
                      Online · Click para unirte
                    </p>
                  )}
                </div>

                {hasOnlineLink && (
                  <img
                    src={googleLogo}
                    className="w-4 h-4 flex-shrink-0"
                    alt="Meet"
                  />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientUpcomingMeetingsDialog;
