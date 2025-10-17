// src/pages/dashboard/items/ItemMeetingsPage.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import MeetingForm from "@/components/meetings/MeetingForm";

import { useMeetingStore } from "@/store/useMeetingStore";
import { useClientItemStore } from "@/store/useClientItemStore";
import { useClientStore } from "@/store/useClientStore";
import MeetingCard from "@/components/meetings/MeetingCard";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useLawyerStore } from "@/store/useLawyerStore";
import MeetingDetailPanel from "@/components/meetings/MeetingDetailPanel";
import RowSkeleton from "@/components/shared/RowSkeleton";

const ItemMeetingsPage = () => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meetingsByClientItem = useMeetingStore((s) => s.meetingsByClientItem);
  const fetchMeetingsByClientItemId = useMeetingStore(
    (s) => s.fetchMeetingsByClientItemId
  );
  const setMeetingsByClientItem = useMeetingStore(
    (s) => s.setMeetingsByClientItem
  );

  useEffect(() => {
    if (!clientItemId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchMeetingsByClientItemId(clientItemId);
      } catch (e) {
        setError("No se pudieron cargar las reuniones");
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      setMeetingsByClientItem([]);
    };
  }, [clientItemId, fetchMeetingsByClientItemId, setMeetingsByClientItem]);

  const [openId, setOpenId] = useState<string | null>(null);
  const openMeeting = meetingsByClientItem.find((m) => m.id === openId) || null;

  const user = useAuthStore((s) => s.user);
  const lawyer = useLawyerStore((s) => s.lawyer);

  const clientItemDetail = useClientItemStore((s) => s.clientItemDetail);
  const clients = useClientStore((s) => s.clientsByLawyer);

  const lawyerFullName = lawyer
    ? `${lawyer.firstName} ${lawyer.lastName}`
    : undefined;
  const lawyerEmail = user?.googleEmail || undefined;

  const actualClient = useMemo(() => {
    if (!clientItemDetail) return null;
    return clients?.find((c) => c.id === clientItemDetail.clientId) || null;
  }, [clientItemDetail, clients]);

  const containerRef = useRef<HTMLDivElement>(null);

  const togglePanel = (id?: string) => {
    if (!id) return; // si no hay id, no hacemos nada
    setOpenId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!openMeeting || !containerRef.current) return;
    // Asegura que el panel quede completamente visible en Y
    containerRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [openMeeting]);

  const scheduled = useMemo(
    () => meetingsByClientItem.filter((m) => m.status === "scheduled"),
    [meetingsByClientItem]
  );
  const completed = useMemo(
    () => meetingsByClientItem.filter((m) => m.status === "completed"),
    [meetingsByClientItem]
  );
  const canceled = useMemo(
    () => meetingsByClientItem.filter((m) => m.status === "canceled"),
    [meetingsByClientItem]
  );

  function EmptyRow({ text }: { text: string }) {
    return <li className="p-4 text-sm text-gray-500">{text}</li>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-x-hidden ${
        openMeeting ? "overflow-y-hidden" : ""
      }`}
    >
      <MeetingForm
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        lawyerEmail={user?.googleEmail || ""}
        defaultParticipants={[
          {
            name:
              actualClient?.type === "Fisica"
                ? `${actualClient?.firstName}  ${actualClient?.lastName}`
                : actualClient?.companyName || "Cliente",
            email: actualClient?.email || "",
          },
        ]}
      />
      <div className="flex flex-col gap-y-4 pl-2 pt-2">
        <h1 className="text-3xl font-semibold leading-tight">Reuniones</h1>
        <div className="flex">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar reuniones"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-800"
            >
              Nueva Reunion
            </Button>
          </div>
        </div>
        <div className="py-4">
          <p className="text-lg text-gray-950 font-medium pb-2">Proximas</p>
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
            {loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : scheduled.length === 0 ? (
              <EmptyRow text="No hay próximas" />
            ) : (
              scheduled.map((m) => (
                <MeetingCard
                  key={m.id}
                  m={m}
                  togglePanel={togglePanel}
                  openId={openId}
                />
              ))
            )}
          </ul>
        </div>
        <div className="py-4">
          <p className="text-lg text-gray-950 font-medium pb-2">Finalizadas</p>
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
            {loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : completed.length === 0 ? (
              <EmptyRow text="No hay finalizadas" />
            ) : (
              completed.map((m) => (
                <MeetingCard
                  key={m.id}
                  m={m}
                  togglePanel={togglePanel}
                  openId={openId}
                />
              ))
            )}
          </ul>
        </div>
        <div className="py-4">
          <p className="text-lg text-gray-950 font-medium pb-2">Canceladas</p>
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
            {loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : canceled.length === 0 ? (
              <EmptyRow text="No hay canceladas" />
            ) : (
              canceled.map((m) => (
                <MeetingCard
                  key={m.id}
                  m={m}
                  togglePanel={togglePanel}
                  openId={openId}
                />
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Panel deslizante separado */}
      <MeetingDetailPanel
        meeting={openMeeting}
        isOpen={Boolean(openMeeting)}
        onClose={() => setOpenId(null)}
        lawyerFullName={lawyerFullName}
        lawyerEmail={lawyerEmail}
        onEdit={(m) => {
          // opcional: abrí tu modal de edición o redirigí
          console.log("Editar", m.id);
        }}
        onCancel={(m) => {
          // opcional: dispará acción para cancelar
          console.log("Cancelar", m.id);
        }}
      />

      {/* <div
        className={`absolute inset-0 z-40 bg-black/30 rounded-sm backdrop-blur-[1px] transition-opacity duration-300 ease-in-out ${
          openMeeting
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpenId(null)}
      />

      <aside
        id="meeting-detail-panel"
        className={`absolute z-50 top-0 right-0 h-full w-full md:w-[380px]
      bg-white border-l border-gray-200 
        transform transition-transform duration-300 ease-in-out will-change-transform
        ${
          openMeeting ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!openMeeting}
      >
        <div className="px-5 pt-4 border-b border-gray-200 flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {openMeeting?.name ?? "Reunión"}
            </h2>
            {openMeeting && (
              <p className="pt-1 pb-4 text-sm text-gray-600">
                {formatDateShort(openMeeting.startAt)} ·{" "}
                {formatTime(openMeeting.startAt)}
              </p>
            )}
          </div>
          <button
            className="ml-3 text-gray-500 hover:text-gray-700"
            onClick={() => setOpenId(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div
          className={`px-5 py-4 space-y-4 h-[calc(100%-56px)] ${
            openMeeting ? "overflow-visible" : "overflow-y-auto scrollbar-none"
          }`}
        >
          {openMeeting && (
            <>
              <div className="text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  {openMeeting.type === "google-meet" ? (
                    <>
                      <img src={googleLogo} alt="Google" className="h-4 w-4" />
                      <span className="font-medium">Google Meet</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4" />
                      <span className="font-medium">Presencial</span>
                    </>
                  )}
                </div>

                {openMeeting.link && (
                  <div className="pt-2">
                    <a
                      href={openMeeting.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline break-all"
                    >
                      {openMeeting.link}
                    </a>
                  </div>
                )}

                {openMeeting.location && (
                  <p className="pt-2">📍 {openMeeting.location}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 pb-2">
                  Participantes
                </p>
                <ul className="flex flex-col gap-y-1">
                  {openMeeting.participants.map((p) => (
                    <li key={p.email} className="text-sm text-gray-700">
                      {p.name ? `${p.name} · ` : ""}
                      {p.email}
                    </li>
                  ))}
                  <li className="text-sm text-gray-700">
                    {`${lawyer?.firstName}  ${lawyer?.lastName} · `}
                    {user?.googleEmail}
                  </li>
                </ul>
              </div>

              {openMeeting.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-900 pb-1">
                    Notas internas
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {openMeeting.notes}
                  </p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button className="bg-blue-800">Editar</Button>
                <Button variant="outline" className="border-gray-300">
                  Cancelar reunión
                </Button>
              </div>
            </>
          )}
        </div>
      </aside> */}
    </div>
  );
};
export default ItemMeetingsPage;
