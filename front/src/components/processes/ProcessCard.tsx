import { formatDateChileShort } from "@/lib/formatDate";
import type { Process } from "@/types/Process";

interface ProcessCardProps {
  p: Process;
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

const ProcessCard = ({ p }: ProcessCardProps) => {
  return (
    <div
      key={p.id}
      className="grid grid-cols-[1fr_2fr_3fr_1fr] pl-10 py-3 gap-x-5"
    >
      <p>{formatDateChileShort(p.dateTime)}</p>
      <p>{p.name}</p>
      <p>{p.description}</p>
      <p>{formatDurationFromSeconds(p.durationSec)}</p>
    </div>
  );
};

export default ProcessCard;
