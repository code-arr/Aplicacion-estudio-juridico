// src/components/items/MeetingsOverviewCard.tsx
import InfoCard from "@/components/ui/infoCard";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { useMeetingStore } from "@/store/useMeetingStore";
import { pickNextAndLast } from "@/utils/meetings";
import { formatARDate } from "@/utils/format";
import MeetingForm from "@/components/meetings/MeetingForm";

type Participant = { name: string; email: string };

type Props = {
  itemId?: string;
  lawyerEmail?: string;
  defaultParticipants?: Participant[];
};

export default function MeetingsOverviewCard({
  itemId,
  lawyerEmail = "",
  defaultParticipants = [],
}: Props) {
  const [open, setOpen] = useState(false);

  const isLoading = useMeetingStore((s) => s.isLoading ?? false);
  const error = useMeetingStore((s) => s.error ?? null);

  const meetingsByClientItem = useMeetingStore((s) => s.meetingsByClientItem);
  const fetchMeetingsByClientItemId = useMeetingStore(
    (s) => s.fetchMeetingsByClientItemId
  );
  const setMeetingsByClientItem = useMeetingStore(
    (s) => s.setMeetingsByClientItem
  );

  useEffect(() => {
    if (!itemId) return;
    (async () => {
      try {
        await fetchMeetingsByClientItemId(itemId);
      } catch (e) {
        console.log(e);
      }
    })();
    return () => {
      setMeetingsByClientItem([]);
    };
  }, [fetchMeetingsByClientItemId, itemId, setMeetingsByClientItem]);

  const { nextUpcoming, lastMeeting } = useMemo(
    () => pickNextAndLast(meetingsByClientItem),
    [meetingsByClientItem]
  );

  return (
    <>
      <MeetingForm
        isDialogOpen={open}
        setIsDialogOpen={setOpen}
        lawyerEmail={lawyerEmail}
        defaultParticipants={defaultParticipants}
      />
      <InfoCard title="Reuniones" className="w-full">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">
            No se pudieron cargar las reuniones.
          </p>
        ) : (
          <div className="text-sm space-y-2">
            <div>
              <p className="text-muted-foreground mb-0.5">Próxima</p>
              {nextUpcoming ? (
                <div className="flex flex-col">
                  <span className="font-medium truncate">
                    {nextUpcoming.name}
                  </span>
                  <span>{formatARDate(nextUpcoming.startAt)}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>

            <div>
              <p className="text-muted-foreground mb-0.5">Última</p>
              {lastMeeting ? (
                <div className="flex flex-col">
                  <span className="font-medium truncate">
                    {lastMeeting.name}
                  </span>
                  <span>{formatARDate(lastMeeting.startAt)}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>

            <Button
              onClick={() => setOpen(true)}
              className="h-8 mt-2 w-32 self-start"
            >
              Agendar reunión
            </Button>
          </div>
        )}
      </InfoCard>
    </>
  );
}
