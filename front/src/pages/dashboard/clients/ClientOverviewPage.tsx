// src/pages/dashboard/clients/ClientOverviewPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { type Client, CLIENT_STATUS_MAP } from "@/types/Client";
import type { ClientItem } from "@/types/ClientItem";
import { selectCategories, useCatalogStore } from "@/store/useCatalogStore";
import { selectClientDetail, useClientStore } from "@/store/useClientStore";
import {
  useClientItemStore,
  selectRecentClientItemsByClientId,
  selectIsClientItemsLoading,
  selectClientItemsByClientId,
} from "@/store/useClientItemStore";
import ItemForm from "@/components/items/ItemForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ErrorScreen from "@/components/shared/ErrorScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import googleLogo from "@/assets/logos/google.png";
import { FileText, Plus, SquarePlus } from "lucide-react";
import ItemCard from "@/components/items/ItemCard";
import { ItemsSearchBar } from "@/components/items/ItemSearchBar";
import EmailDialog from "@/components/clients/EmailDialog";
import { useJoinMeeting } from "@/hooks/useJoinMeeting";
import { useMeetingStore } from "@/store/useMeetingStore";
import { pickNextAndLast } from "@/utils/meetings";
import { formatDateChileShort } from "@/lib/formatDate";
import { useStatsStore } from "@/store/useStatsStore";
import { useClientTime } from "@/hooks/useClientTime";
import { formatHHMMFromSeconds } from "@/lib/time";
import { useToast } from "@/hooks/useToast";
import { removeClient } from "@/api/lawyer";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { updateClient } from "@/api/client";
import ClientEditDialog from "@/components/clients/ClientEditDialog";
import { formatClientRate } from "@/lib/money";
import { isSafeMeetingUrl } from "@/lib/urls";
import ClientUpcomingMeetingsDialog from "@/components/meetings/ClientUpcomingMeetingsDialog";

const ClientOverviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const categories = useCatalogStore(selectCategories);
  const lawyer = useLawyerStore((s) => s.lawyer);
  const user = useAuthStore((s) => s.user);

  const clientDetail = useClientStore(selectClientDetail);
  const hydrateClientsByLawyer = useClientStore((s) => s.hydrateByLawyer);

  const fetchClientItemsByClientId = useClientItemStore(
    (s) => s.fetchClientItemsByClientId
  );
  const all = useClientItemStore(selectClientItemsByClientId);
  const isLoadingItems = useClientItemStore(selectIsClientItemsLoading);
  const recent = useClientItemStore(selectRecentClientItemsByClientId);

  const fetchClientDetailStats = useStatsStore((s) => s.fetchClientDetail);

  // ============
  // Próxima reunión (URL y fecha)
  // ============
  const fetchMeetingsByClient = useMeetingStore((s) => s.fetchMeetingsByClient);
  const meetingsByClient = useMeetingStore((s) => s.meetingsByClient);
  const setMeetingsByClient = useMeetingStore((s) => s.setMeetingsByClient);

  // 👇 NUEVO: Obtenemos la próxima reunión del cliente (ajustá al selector real que tengas)
  // Si NO tenés store para esto aún, dejalo en null y el botón quedará deshabilitado.
  const { nextUpcoming } = useMemo(
    () => pickNextAndLast(meetingsByClient),
    [meetingsByClient]
  );
  const nextMeetingUrl: string | null | undefined = nextUpcoming?.link;

  // 👇 NUEVO: Lógica del botón (reusable)
  const {
    disabled: joinDisabled,
    join,
    copy,
  } = useJoinMeeting(nextMeetingUrl ?? null, {
    onInvalidUrl: () => console.warn("Esta reunión no tiene un enlace válido."),
    onOpenError: () => console.error("No se pudo abrir el enlace."),
    onOpened: () => console.log("Abriendo reunión en el navegador…"),
  });

  const { totalSeconds } = useClientTime(clientDetail?.id ?? null);

  const { toast } = useToast?.() ?? { toast: () => {} }; // por si no tenés el hook

  const handleRemoveClient = async () => {
    if (!clientDetail?.id) return;

    console.log("[remove] voy a borrar id =", clientDetail.id, clientDetail);

    const ok = window.confirm(
      "¿Seguro que querés eliminar este cliente? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    setIsDeleting(true);
    try {
      await removeClient(clientDetail.id);

      // ✅ actualizá caches locales al instante
      useClientStore.getState().removeClientById(clientDetail.id);
      useClientStore.getState().clearClientDetail(clientDetail.id);
      useClientStore.getState().invalidateById(clientDetail.id);
      /* useClientStore.getState().softInvalidateAfterDelete(); */

      toast?.({
        title: "Cliente eliminado",
        description: "Se eliminó correctamente.",
      });

      // ✅ navegá a la lista
      navigate("/dashboard/clients");

      // ✅ (opcional) re-hydrate por abogado si tenés el id
      if (lawyer?.id) await hydrateClientsByLawyer(lawyer.id, { force: true });
    } catch (e: any) {
      // Tip: podés afinar mensajes por status
      const msg =
        e?.response?.data?.message ??
        (e?.response?.status === 403
          ? "No tenés permisos para eliminar este cliente."
          : e?.response?.status === 409
          ? "No se puede eliminar: el cliente tiene elementos asociados."
          : "Error inesperado");

      toast?.({
        variant: "destructive",
        title: "No se pudo eliminar",
        description: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmitEdit = async (payload: Partial<Client>) => {
    if (!clientDetail?.id) return;
    setIsSaving(true);
    try {
      // 1) request
      const updated = await updateClient(clientDetail.id, payload);

      // 2) merge local (optimista) — mantené coherentes listas + detail
      const S = useClientStore.getState();
      // actualizá detail
      S.setClientDetail({ ...clientDetail, ...updated });

      // si tenés lista por abogado, actualizala:
      const curByLawyer = useClientStore.getState().clientsByLawyer;
      if (curByLawyer) {
        const next = curByLawyer.map((c) =>
          c.id === clientDetail.id ? { ...c, ...updated } : c
        );
        useClientStore.getState().setClientsByLawyer(next);
      }
      // (si usás lista global admin, hacé lo mismo con setAllClients)

      // invalidá TTL para que un próximo hydrate traiga datos frescos
      useClientStore.getState().invalidateById(clientDetail.id);

      toast?.({
        title: "Cambios guardados",
        description: "El cliente fue actualizado.",
      });
      setEditOpen(false);
    } catch (e: any) {
      toast?.({
        variant: "destructive",
        title: "No se pudo actualizar",
        description: e?.response?.data?.message ?? "Error inesperado",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCategory = (categoryId: string) => {
    navigate(`category/${categoryId}`, {
      state: { prevRoute: location.pathname },
    });
  };

  const handleViewDetails = (item: ClientItem) => {
    navigate(`/dashboard/item/${item.id}/documents`, {
      state: { prevRoute: location.pathname },
    });
  };

  const handleOpenMeetingsModal = () => {
    if (!upcomingMeetings.length) {
      toast?.({
        title: "Sin reuniones próximas",
        description: "No hay reuniones programadas para este cliente.",
      });
      return;
    }
    setIsMeetingsModalOpen(true);
  };

  const handleJoinSpecificMeeting = async (link?: string | null) => {
    if (!link || !isSafeMeetingUrl(link)) {
      toast?.({
        variant: "destructive",
        title: "Enlace inválido",
        description: "Esta reunión no tiene un enlace válido.",
      });
      return;
    }

    const ok = await window.api.openExternal(link.trim());
    if (!ok) {
      toast?.({
        variant: "destructive",
        title: "No se pudo abrir la reunión",
        description:
          "Revisá tu conexión o copiá el enlace desde el calendario si el problema persiste.",
      });
      return;
    }

    setIsMeetingsModalOpen(false);
  };

  useEffect(() => {
    if (!clientDetail?.id) return;
    fetchClientItemsByClientId(clientDetail.id);
  }, [clientDetail?.id, fetchClientItemsByClientId]);

  useEffect(() => {
    if (!clientDetail?.id) return;
    fetchClientDetailStats(clientDetail.id);
  }, [clientDetail?.id, fetchClientDetailStats]);

  useEffect(() => {
    if (!clientDetail?.id) return;
    (async () => {
      try {
        await fetchMeetingsByClient(clientDetail.id ?? "");
      } catch (e) {
        console.log(e);
      }
    })();
    return () => {
      setMeetingsByClient([]);
    };
  }, [fetchMeetingsByClient, clientDetail?.id, setMeetingsByClient]);

  const upcomingMeetings = useMemo(() => {
    const now = Date.now();

    return meetingsByClient
      .filter((m) => {
        if (!m.startAt) return false;
        const t = new Date(m.startAt).getTime();
        return !Number.isNaN(t) && t >= now;
      })
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )
      .slice(0, 5);
  }, [meetingsByClient]);

  const nextMeeting = upcomingMeetings[0] ?? null;
  const nextMeetingStartAt = nextMeeting?.startAt ?? null;

  // Fecha legible (si hay reunión). Si no, mostramos un texto “Sin reunión”
  const fechaLegible = useMemo(() => {
    if (!nextMeetingStartAt) return "Sin reunión programada";
    const d = new Date(nextMeetingStartAt);
    const dia = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(d);
    const fecha = new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
    })
      .format(d)
      .replace(".", "");
    const hora = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return `${dia}, ${fecha} ${hora}`;
  }, [nextMeetingStartAt]);

  const StatusBadge = (status: Client["status"]) => {
    const cfg = CLIENT_STATUS_MAP[status] ?? {
      label: "Desconocido",
      className: "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200",
    };
    return (
      <Badge
        className={`${cfg.className}rounded-xl text-sm font-semibold cursor-default`}
      >
        {cfg.label}
      </Badge>
    );
  };

  const statusMap = {
    active: <span className="text-green-600 font-medium">Activo</span>,
    inactive: (
      <span className="text-muted-foreground font-medium">Inactivo</span>
    ),
    under_review: (
      <span className="text-yellow-600 font-medium">En revisión</span>
    ),
  };

  if (!clientDetail) return <ErrorScreen message="No se encontró el cliente" />;

  const isGoogleConnected = !!user?.googleEmail;

  return (
    <div>
      <ItemForm isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      <EmailDialog
        isOpen={isEmailOpen}
        onOpenChange={setIsEmailOpen}
        toEmail={clientDetail.email ?? ""}
        clientId={clientDetail.id!}
      />
      <div className="space-y-6">
        {/* CONTENEDOR GENERAL */}
        <div className="bg-white border border-gray-200 rounded-md shadow px-6 max-w-8xl mx-auto">
          {/* SECCIÓN DE INFORMACIÓN Y ACCIONES CON LÍNEA VERTICAL */}

          <div className="flex flex-col md:flex-row md:items-stretch gap-6  ">
            {/* INFORMACIÓN DEL CLIENTE */}
            <div className="md:w-1/2 md:pr-6 md:border-r md:border-gray-200">
              <div className="pt-4 pr-6">
                <h3 className="font-semibold text-[hsl(225,15%,15%)] mb-3">
                  Información del Cliente
                </h3>
              </div>
              <div className="flex pb-4 pr-6">
                <div className="w-1/2">
                  <p className="text-sm text-[hsl(225,10%,50%)]">
                    Tipo de Cliente
                  </p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {clientDetail.type === "Fisica"
                      ? "Persona Física"
                      : "Persona Jurídica"}
                  </p>

                  <p className="text-sm text-[hsl(225,10%,50%)]">
                    Fecha de creación
                  </p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {formatDateChileShort(clientDetail.createdAt!)}
                  </p>

                  <p className="text-sm text-[hsl(225,10%,50%)]">Estado</p>
                  <div className="mt-1">{StatusBadge(clientDetail.status)}</div>
                </div>
                <div className="w-1/2">
                  <p className="text-sm text-[hsl(225,10%,50%)]">
                    Correo Electrónico
                  </p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {clientDetail.email}
                  </p>
                  <p className="text-sm text-[hsl(225,10%,50%)]">Telefono</p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {clientDetail.phone}
                  </p>
                  <p className="text-sm text-[hsl(225,10%,50%)]">Dirección</p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {clientDetail.address}
                  </p>
                  <p className="text-sm text-[hsl(225,10%,50%)]">Tarifa</p>
                  <p className="font-bold mb-2 text-[hsl(225,15%,15%)]">
                    {formatClientRate(
                      clientDetail.currency,
                      clientDetail.hourlyRate
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 items-stretch pb-2">
                <Button
                  variant="outline"
                  className="w-full h-11 font-medium border-gray-300 hover:bg-gray-50"
                  onClick={() => setEditOpen(true)}
                >
                  Editar cliente
                </Button>

                {/* <Button
                  onClick={handleRemoveClient}
                  disabled={isDeleting}
                  className="w-full h-11 font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-70"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar cliente"}
                </Button> */}
              </div>
            </div>

            {/* Google */}
            <div className="md:w-1/2 relative">
              {!isGoogleConnected && (
                <div
                  className="absolute inset-0 z-10 rounded-md
                bg-white/70 backdrop-blur-[2px]
                  flex flex-col items-center justify-center
                  text-center px-6 cursor-not-allowed"
                >
                  <p className="mt-1 text-sm text-[hsl(225,10%,45%)] max-w-xs">
                    Conectá Google para usar Gmail y Meet desde la aplicación.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-7 content-center">
                <div className="rounded-md border border-gray-200 p-4">
                  <h3 className="font-semibold text-[hsl(225,15%,15%)] mb-3">
                    Gmail
                  </h3>
                  <Button
                    variant="outline"
                    className="w-full h-11 justify-start gap-2 font-medium border-[hsl(210,100%,40%)]
                  hover:bg-[hsl(210,100%,95%)]"
                    aria-label="Enviar correo con Gmail"
                    onClick={() => setIsEmailOpen(true)}
                  >
                    <img
                      src={googleLogo}
                      className="w-5 h-5"
                      alt="Logo Google"
                    />
                    Enviar mail
                  </Button>
                </div>
                <div className="rounded-md border border-gray-200 p-4">
                  <h3 className="font-semibold text-[hsl(225,15%,15%)] mb-3">
                    Próxima Reunión
                  </h3>

                  <Button
                    onClick={handleOpenMeetingsModal}
                    variant="outline"
                    disabled={upcomingMeetings.length === 0}
                    title={
                      upcomingMeetings.length === 0
                        ? "Sin reunión válida"
                        : "Ver próximas reuniones"
                    }
                    className="w-full h-11 items-center justify-between px-4
                border-[hsl(210,100%,40%)] hover:bg-[hsl(210,100%,95%)]
                  disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={
                      upcomingMeetings.length === 0
                        ? "Sin reunión programada"
                        : "Ver próximas reuniones del cliente"
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <img
                        src={googleLogo}
                        className="w-4 h-4"
                        alt="Logo Google"
                      />
                      <span className="font-medium">Meet</span>
                    </span>
                    <span className="text-sm text-[hsl(225,10%,40%)]">
                      {fechaLegible}
                    </span>
                  </Button>

                  {/* Opcional: copiar enlace */}
                  {/* <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={copy}
                    disabled={joinDisabled}
                  >
                    Copiar enlace
                  </Button> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <Card className="bg-white border-gray-200 shadow-sm rounded-lg">
          <CardHeader className="flex-row justify-between border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-[hsl(225,15%,15%)]">
              <FileText className="h-5 w-5" />
              Contenido del Cliente
            </CardTitle>
            <div className="flex w-1/2 gap-5">
              <div className="relative flex-1">
                <ItemsSearchBar
                  items={all}
                  limit={4}
                  onSelect={(item) => handleViewDetails(item)}
                />
                {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                /> */}
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#f3b600] hover:bg-[#ffbf00]/80 shadow-lg  cursor-pointer"
              >
                <SquarePlus />
                Agregar Item
              </Button>
            </div>
          </CardHeader>

          {/* Formulario de ítems */}
          <CardContent className="space-y-3 divide-y divide-gray-200">
            {categories.length === 0 ? (
              <div className="text-center py-6  ">
                <h3 className="text-lg font-medium text-[hsl(225,15%,15%)] mb-2">
                  No hay categorias aún
                </h3>
                <p className="text-gray-600">Agrega tu primer categoria</p>
                <Button className="law-gradient hover:opacity-90 mt-5">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Categoria
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-5 py-6 gap-x-3">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    className="h-16 bg-[#f3b600] hover:bg-[#f3b600]/70 text-base capitalize"
                    onClick={() => handleOpenCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
            <div className="pt-2">
              <h3 className="font-semibold text-[1.1rem] text-[hsl(225,15%,15%)] mb-3">
                Items Recientes
              </h3>
              {isLoadingItems ? (
                // Loader pequeño en línea
                <div className="py-6 flex items-center gap-3 text-[hsl(225,10%,50%)]">
                  <LoadingSpinner />
                  Cargando ítems del cliente…
                </div>
              ) : all.length === 0 ? (
                // Empty state lindo con CTA
                <div className="py-6 rounded-md border border-dashed border-gray-300 bg-gray-50">
                  <div className="text-center px-6">
                    <p className="text-[hsl(225,15%,15%)] font-medium">
                      Aún no hay ítems para este cliente
                    </p>
                    <p className="text-sm text-[hsl(225,10%,45%)]">
                      Creá el primero para empezar a trabajar
                    </p>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="mt-3 bg-[#f3b600] hover:bg-[#ffbf00]/80"
                    >
                      <SquarePlus className="mr-2" /> Agregar Item
                    </Button>
                  </div>
                </div>
              ) : recent.length === 0 ? (
                // Tiene ítems pero ninguno “reciente” según tu regla (raro, pero contemplado)
                <div className="py-4 text-sm text-[hsl(225,10%,45%)]">
                  No hay movimientos recientes.
                </div>
              ) : (
                <div className="grid grid-cols-1 pr-10 gap-4">
                  {recent.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="bg-[#ffffff] border-gray-200 shadow-sm rounded-lg">
          <CardHeader>
            <CardTitle className="text-[hsl(225,15%,15%)]">
              Resumen del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[hsl(225,10%,50%)]">Tiempo Total</p>
                <p className="font-semibold text-[hsl(225,15%,15%)]">
                  {formatHHMMFromSeconds(totalSeconds)}
                </p>
              </div>
              <div>
                <p className="text-[hsl(225,10%,50%)]">Ítems Registrados</p>
                <p className="font-semibold text-[hsl(225,15%,15%)]">
                  {all?.length}
                </p>
              </div>
              <div>
                <p className="text-[hsl(225,10%,50%)]">Última Actualización</p>
                <p className="font-semibold text-[hsl(225,15%,15%)]">
                  {formatDateChileShort(clientDetail.updatedAt!)}
                </p>
              </div>
              <div>
                <p className="text-[hsl(225,10%,50%)]">Estado</p>
                <p className="font-semibold">
                  {clientDetail?.status && statusMap[clientDetail.status]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <ClientEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={clientDetail}
        loading={isSaving}
        onSubmit={onSubmitEdit}
      />
      <ClientUpcomingMeetingsDialog
        open={isMeetingsModalOpen}
        onOpenChange={setIsMeetingsModalOpen}
        meetings={upcomingMeetings}
        onJoin={handleJoinSpecificMeeting}
      />
    </div>
  );
};

export default ClientOverviewPage;
