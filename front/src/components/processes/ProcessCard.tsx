// src/components/processes/ProcessCard.tsx
import { formatDateChileShort } from "@/lib/formatDate";
import type { Process } from "@/types/Process";
import { Trash2 } from "lucide-react";

interface ProcessCardProps {
  p: Process;
  onDelete?: (p: Process) => void;
  deleting?: boolean;
}

function formatDurationFromSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds === 0) return "0m";

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${remainingMinutes}m`;
  }
}

const ProcessCard = ({ p, onDelete, deleting }: ProcessCardProps) => {
  return (
    <div className="grid grid-cols-[12rem_1.6fr_3fr_1fr_112px] px-4 py-3 gap-x-4 items-center">
      <p>{formatDateChileShort(p.dateTime)}</p>
      <p>{p.name}</p>
      <p className="truncate" title={p.description || ""}>
        {p.description}
      </p>
      <p>{formatDurationFromSeconds(p.durationSec)}</p>

      <div className="flex justify-end">
        <button
          onClick={() => !deleting && onDelete?.(p)}
          disabled={deleting}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.85rem] w-[96px] justify-center
        ${deleting ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50"}
        border-red-300 text-red-700`}
          title={deleting ? "Eliminando..." : "Eliminar trámite"}
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? "..." : "Eliminar"}
        </button>
      </div>
    </div>
  );
};

export default ProcessCard;
