import type { Process } from "@/types/Process";

interface ProcessCardProps {
  p: Process;
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes && minutes !== 0) return "—"; // si es null o undefined
  if (minutes === 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

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
    <div key={p.id} className="grid grid-cols-[1fr_2fr_3fr_1fr] pl-10 py-3">
      <p>{p.dateTime}</p>
      <p>{p.name}</p>
      <p>{p.description}</p>
      <p>{formatDuration(p.durationSec)}</p>
    </div>
  );
};

export default ProcessCard;
