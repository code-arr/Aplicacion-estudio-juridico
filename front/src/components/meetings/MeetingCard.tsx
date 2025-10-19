import type { Meeting } from "@/types/Meeting";
import { ChevronRight, User } from "lucide-react";
import googleLogo from "@/assets/logos/cromoVerde.png";
import { formatDateWeekdayShort, formatTimeChile } from "@/lib/formatDate";

interface MeetingCardProps {
  m: Meeting;
  togglePanel: (id: string) => void;
  openId?: string | null;
}

const MeetingCard = ({ m, togglePanel, openId }: MeetingCardProps) => {
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
          <p className="truncate font-semibold text-lg text-gray-900 mb-1">
            {m.name}
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
        <div className="pr-2">
          <button
            className="cursor-pointer"
            onClick={() => togglePanel(m.id ?? "")}
            aria-expanded={openId === m.id}
            aria-controls="meeting-detail-panel"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </li>
  );
};

export default MeetingCard;
