import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, User } from "lucide-react";
import googleLogo from "@/assets/logos/cromoVerde.png";
import MeetingForm from "@/components/meetings/MeetingForm";
import type { Meeting } from "@/types/Meeting";

const meetings: Meeting[] = [
  {
    id: "mtg_101",
    name: "Seguimiento medidas cautelares",
    startAt: "2025-08-28T10:30:00-03:00",
    endAt: "2025-08-28T11:15:00-03:00",
    participants: [
      { name: "Dra. Ibarra", email: "dibarra@estudio.com" },
      { name: "Cliente", email: "cliente@mail.com" },
    ],
    type: "google-meet",
    meetLink: "https://meet.google.com/abc-defg-hij",
    status: "scheduled",
    description: "Repasar documentación enviada por la contraparte.",
    createdAt: "2025-08-20T12:00:00-03:00",
    updatedAt: "2025-08-20T12:00:00-03:00",
  },
  {
    id: "mtg_099",
    name: "Revisión de estrategia",
    startAt: "2025-08-22T16:00:00-03:00",
    endAt: "2025-08-22T16:45:00-03:00",
    participants: [
      { name: "Dra. Ibarra", email: "dibarra@estudio.com" },
      { name: "Asociado", email: "asociado@estudio.com" },
    ],
    type: "google-meet",
    meetLink: "https://meet.google.com/xyz-uvwx-123",
    status: "completed",
    description: "Definir próximos pasos y responsables.",
    createdAt: "2025-08-15T09:20:00-03:00",
    updatedAt: "2025-08-22T17:00:00-03:00",
  },
  {
    id: "mtg_095",
    name: "Llamada con perito",
    startAt: "2025-08-18T11:00:00-03:00",
    endAt: "2025-08-18T11:30:00-03:00",
    participants: [
      { name: "Perito", email: "perito@correo.com" },
      { name: "Cliente", email: "cliente@mail.com" },
    ],
    type: "google-meet",
    meetLink: "https://meet.google.com/meet-perito-11",
    status: "canceled",
    description: "Se reprograma por indisponibilidad del perito.",
    createdAt: "2025-08-10T10:00:00-03:00",
    updatedAt: "2025-08-17T18:10:00-03:00",
  },
  {
    id: "mtg_110",
    name: "Reunión con cliente en oficina",
    startAt: "2025-09-02T15:00:00-03:00",
    endAt: "2025-09-02T16:00:00-03:00",
    participants: [
      { name: "Dra. Ibarra", email: "dibarra@estudio.com" },
      { name: "Cliente", email: "cliente@mail.com" },
    ],
    type: "in-person",
    location: "Oficina central - Sala de reuniones 1",
    status: "scheduled",
    description: "Revisión de contrato de arrendamiento.",
    createdAt: "2025-08-25T12:00:00-03:00",
    updatedAt: "2025-08-25T12:00:00-03:00",
  },
  {
    id: "mtg_111",
    name: "Cita con testigos",
    startAt: "2025-08-30T10:00:00-03:00",
    endAt: "2025-08-30T11:30:00-03:00",
    participants: [
      { name: "Asociado", email: "asociado@estudio.com" },
      { name: "Testigo A", email: "testigoA@mail.com" },
      { name: "Testigo B", email: "testigoB@mail.com" },
    ],
    type: "in-person",
    location: "Tribunales - Sala de espera piso 3",
    status: "scheduled",
    description: "Preparación de testimonios previos a la audiencia.",
    createdAt: "2025-08-20T09:30:00-03:00",
    updatedAt: "2025-08-20T09:30:00-03:00",
  },
  {
    id: "mtg_112",
    name: "Mesa de trabajo con perito",
    startAt: "2025-09-05T09:00:00-03:00",
    endAt: "2025-09-05T10:30:00-03:00",
    participants: [
      { name: "Perito", email: "perito@correo.com" },
      { name: "Dra. Ibarra", email: "dibarra@estudio.com" },
    ],
    type: "in-person",
    location: "Estudio jurídico - Sala de juntas",
    status: "scheduled",
    description: "Analizar informe técnico y validar pruebas.",
    createdAt: "2025-08-27T14:00:00-03:00",
    updatedAt: "2025-08-27T14:00:00-03:00",
  },
  {
    id: "mtg_113",
    name: "Consulta inicial con nuevo cliente",
    startAt: "2025-09-07T09:30:00-03:00",
    endAt: "2025-09-07T10:15:00-03:00",
    participants: [
      { name: "Dr. López", email: "dlopez@estudio.com" },
      { name: "Cliente Nuevo", email: "nuevo.cliente@mail.com" },
    ],
    type: "google-meet",
    meetLink: "https://meet.google.com/cli-ente-123",
    status: "scheduled",
    description: "Presentación y recopilación de antecedentes.",
    createdAt: "2025-08-28T10:00:00-03:00",
    updatedAt: "2025-08-28T10:00:00-03:00",
  },
  {
    id: "mtg_114",
    name: "Revisión de documentos societarios",
    startAt: "2025-09-01T14:00:00-03:00",
    endAt: "2025-09-01T15:30:00-03:00",
    participants: [
      { name: "Dra. Ibarra", email: "dibarra@estudio.com" },
      { name: "Asociado", email: "asociado@estudio.com" },
    ],
    type: "in-person",
    location: "Oficina central – Sala de juntas 2",
    status: "completed",
    description: "Definición de modificaciones estatutarias.",
    createdAt: "2025-08-22T12:30:00-03:00",
    updatedAt: "2025-09-01T16:00:00-03:00",
  },
  {
    id: "mtg_115",
    name: "Audiencia preliminar de conciliación",
    startAt: "2025-09-10T11:00:00-03:00",
    endAt: "2025-09-10T12:00:00-03:00",
    participants: [
      { name: "Cliente", email: "cliente@mail.com" },
      { name: "Contraparte", email: "contraparte@mail.com" },
    ],
    type: "in-person",
    location: "Tribunales – Sala 4",
    status: "scheduled",
    description: "Verificar disponibilidad de testigos y peritos.",
    createdAt: "2025-08-29T09:00:00-03:00",
    updatedAt: "2025-08-29T09:00:00-03:00",
  },
  {
    id: "mtg_116",
    name: "Reunión de cierre de contrato",
    startAt: "2025-08-26T17:00:00-03:00",
    endAt: "2025-08-26T18:00:00-03:00",
    participants: [
      { name: "Dra. Ibarra", email: "dibarra@estudio.com" },
      { name: "Cliente", email: "cliente@mail.com" },
    ],
    type: "google-meet",
    meetLink: "https://meet.google.com/cie-rre-contrato",
    status: "completed",
    description: "Confirmación de cláusulas y firma digital.",
    createdAt: "2025-08-20T15:00:00-03:00",
    updatedAt: "2025-08-26T18:05:00-03:00",
  },
  {
    id: "mtg_117",
    name: "Reprogramación con perito técnico",
    startAt: "2025-08-29T09:00:00-03:00",
    endAt: "2025-08-29T09:45:00-03:00",
    participants: [
      { name: "Perito", email: "perito@correo.com" },
      { name: "Asociado", email: "asociado@estudio.com" },
    ],
    type: "google-meet",
    meetLink: "https://meet.google.com/per-ito-999",
    status: "canceled",
    description: "Se cancela por imposibilidad de conexión.",
    createdAt: "2025-08-24T10:00:00-03:00",
    updatedAt: "2025-08-28T20:00:00-03:00",
  },
];

const formatDateShort = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short", // Lun, Mar, Mié...
    day: "numeric", // 23
    month: "short", // ago.
  }).format(date);
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24h
  }).format(date);
};

const ItemMeetingsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const openMeeting = meetings.find((m) => m.id === openId) || null;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMeeting || !containerRef.current) return;
    // Asegura que el panel quede completamente visible en Y
    containerRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [openMeeting]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-x-hidden ${
        openMeeting && "overflow-y-hidden"
      }`}
    >
      <MeetingForm
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        defaultParticipants={[{ name: "adasdsa", email: "afadsas" }]}
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
            {meetings
              .filter((m) => m.status === "scheduled")
              .map((m) => (
                <li key={m.id} className="p-4">
                  {/* fila */}
                  <div className="flex items-center gap-4">
                    {/* fecha */}
                    <div className="w-24 shrink-0 text-gray-500 flex flex-col items-center">
                      <span className="text-sm font-medium">
                        {`${formatDateShort(m.startAt)}.`}
                      </span>
                      <span className="text-sm font-medium">
                        {formatTime(m.startAt)}
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
                        onClick={() => setOpenId(openId === m.id ? null : m.id)}
                        aria-expanded={openId === m.id}
                        aria-controls="meeting-detail-panel"
                      >
                        <ChevronRight
                          className={`transition-transform duration-200 ${
                            openId === m.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
        <div className="py-4">
          <p className="text-lg text-gray-950 font-medium pb-2">Finalizadas</p>
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
            {meetings
              .filter((m) => m.status === "completed")
              .map((m) => (
                <li key={m.id} className="p-4">
                  {/* fila */}
                  <div className="flex items-center gap-4">
                    {/* fecha */}
                    <div className="w-24 shrink-0 text-gray-500 flex flex-col items-center">
                      <span className="text-sm font-medium">
                        {`${formatDateShort(m.startAt)}.`}
                      </span>
                      <span className="text-sm font-medium">
                        {formatTime(m.startAt)}
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
                          <span className="font-medium">Presencial</span>
                        )}
                      </div>
                    </div>

                    {/* arrow */}
                    <div className="pr-2">
                      <button
                        className="cursor-pointer"
                        onClick={() => setOpenId(openId === m.id ? null : m.id)}
                        aria-expanded={openId === m.id}
                        aria-controls="meeting-detail-panel"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
        <div className="py-4">
          <p className="text-lg text-gray-950 font-medium pb-2">Canceladas</p>
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
            {meetings
              .filter((m) => m.status === "canceled")
              .map((m) => (
                <li key={m.id} className="p-4">
                  {/* fila */}
                  <div className="flex items-center gap-4">
                    {/* fecha */}
                    <div className="w-24 shrink-0 text-gray-500 flex flex-col items-center">
                      <span className="text-sm font-medium">
                        {`${formatDateShort(m.startAt)}.`}
                      </span>
                      <span className="text-sm font-medium">
                        {formatTime(m.startAt)}
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
                          <span className="font-medium">Presencial</span>
                        )}
                      </div>
                    </div>

                    {/* arrow */}
                    <div className="pr-2">
                      <button
                        className="cursor-pointer"
                        onClick={() => setOpenId(openId === m.id ? null : m.id)}
                        aria-expanded={openId === m.id}
                        aria-controls="meeting-detail-panel"
                      >
                        <ChevronRight
                          className={`transition-transform duration-200 ${
                            openId === m.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Overlay opcional para cerrar al hacer click afuera */}
      <div
        className={`absolute inset-0 z-40 bg-black/30 rounded-sm backdrop-blur-[1px] transition-opacity duration-300 ease-in-out ${
          openMeeting
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpenId(null)}
      />

      {/* Panel deslizante */}
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
        {/* Header */}
        <div className="px-5 pt-4 border-b border-gray-200 flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {openMeeting?.name ?? "Reunión"}
            </h2>
            {openMeeting && (
              <p className="pt-1 pb-4 text-sm text-gray-600">
                {formatDateShort(openMeeting.startAt)} ·{" "}
                {formatTime(openMeeting.startAt)}–
                {formatTime(openMeeting.endAt)}
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

        {/* Body */}
        <div
          className={`px-5 py-4 space-y-4 h-[calc(100%-56px)] ${
            openMeeting ? "overflow-visible" : "overflow-y-auto scrollbar-none"
          }`}
        >
          {openMeeting && (
            <>
              {/* Tipo / ubicación / link */}
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

                {openMeeting.meetLink && (
                  <div className="pt-2">
                    <a
                      href={openMeeting.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline break-all"
                    >
                      {openMeeting.meetLink}
                    </a>
                  </div>
                )}

                {openMeeting.location && (
                  <p className="pt-2">📍 {openMeeting.location}</p>
                )}
              </div>

              {/* Participantes */}
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
                </ul>
              </div>

              {/* Notas */}
              {openMeeting.description && (
                <div>
                  <p className="text-sm font-medium text-gray-900 pb-1">
                    Notas internas
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {openMeeting.description}
                  </p>
                </div>
              )}

              {/* Acciones mínimas */}
              <div className="pt-2 flex gap-2">
                <Button className="bg-blue-800">Editar</Button>
                <Button variant="outline" className="border-gray-300">
                  Cancelar reunión
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};
export default ItemMeetingsPage;
