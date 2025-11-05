// src/pages/dashboard/items/ItemMeetingsPage.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import type { Meeting } from "@/types/Meeting";
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
import { updateMeeting } from "@/api/meeting";
import EditMeetingModal from "@/components/meetings/EditMeetingModal";
import { useToast } from "@/hooks/useToast";
import ManualTimeDialog from "@/components/meetings/ManualTimeModal";

const ItemMeetingsPage = () => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { toast } = useToast?.() ?? { toast: () => {} };

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualTarget, setManualTarget] = useState<Meeting | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meetingsByClientItem = useMeetingStore((s) => s.meetingsByClientItem);
  const fetchMeetingsByClientItemId = useMeetingStore(
    (s) => s.fetchMeetingsByClientItemId
  );
  const setMeetingsByClientItem = useMeetingStore(
    (s) => s.setMeetingsByClientItem
  );
  const cancelMeetingById = useMeetingStore((s) => s.cancelMeetingById);
  const deleteMeetingById = useMeetingStore((s) => s.deleteMeetingById);

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

  const handleOpenEdit = (m: Meeting) => {
    setSelected(m);
    setEditOpen(true);
  };

  const handleConfirmEdit = async (patch: Partial<Meeting>) => {
    if (patch.status === "completed") {
      const startAtMs = selected?.startAt ? Date.parse(selected.startAt) : NaN;
      if (!Number.isFinite(startAtMs) || Date.now() < startAtMs) {
        toast?.({
          title: "No podés finalizar aún",
          description: "La reunión todavía no comenzó.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!selected) return;
    const id = selected.id;

    // si el patch pide cerrar y no tiene endAt, lo ponemos ahora
    const finalizePatch =
      patch.status === "completed" && !patch.endAt
        ? { ...patch, endAt: new Date().toISOString() }
        : patch;

    const prev = meetingsByClientItem;
    const next = meetingsByClientItem.map((x) =>
      x.id === id ? { ...x, ...patch } : x
    );
    setMeetingsByClientItem(next);

    try {
      setSavingEdit(true);
      const isGoogle = selected.type === "google-meet";
      const updated = await updateMeeting(
        id!,
        finalizePatch,
        isGoogle ? user?.email : undefined
      );

      const merged = next.map((x) => (x.id === id ? { ...x, ...updated } : x));
      setMeetingsByClientItem(merged);

      toast?.({ title: "Reunión actualizada" });
      setEditOpen(false);
      setSelected(null);
    } catch (err: any) {
      setMeetingsByClientItem(prev);
      toast?.({
        title: "No se pudo actualizar",
        description: err?.response?.data?.message ?? "Probá de nuevo",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleComplete = async (m: Meeting) => {
    if (m.status !== "scheduled") return;

    // opcional: confirmación, igual que cancelar
    const ok = window.confirm(`¿Finalizar “${m.name}” ahora?`);
    if (!ok) return;

    const id = m.id!;

    const prev = meetingsByClientItem;
    const next: Meeting[] = prev.map((x) =>
      x.id === id ? { ...x, status: "completed" as Meeting["status"] } : x
    );
    setMeetingsByClientItem(next);

    try {
      setCompletingId(id);
      // 👇 pasamos el email del organizador para que, si es Google, actualice endAt en Calendar
      const updated = await updateMeeting(
        id,
        { status: "completed" },
        user?.email
      );
      const merged = next.map((x) => (x.id === id ? { ...x, ...updated } : x));
      setMeetingsByClientItem(merged);
      toast?.({ title: "Reunión finalizada" });
      if (openId === id) setOpenId(null); // cerrar panel
    } catch (err: any) {
      setMeetingsByClientItem(prev); // rollback
      toast?.({
        title: "No se pudo finalizar",
        description: err?.response?.data?.message ?? "Probá de nuevo",
        variant: "destructive",
      });
    } finally {
      setCompletingId(null);
    }
  };

  const handleCancel = async (m: Meeting) => {
    if (m.status === "canceled") return;
    const ok = window.confirm(`¿Cancelar “${m.name}”?`);
    if (!ok) return;

    try {
      setCancellingId(m.id!);
      await cancelMeetingById(m, user.email!);
      if (openId === m.id) setOpenId(null); // cierro panel si era esa
    } catch {
      alert("No se pudo cancelar la reunión. Intenta de nuevo.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDelete = async (m: Meeting) => {
    const ok = window.confirm(
      `¿Eliminar “${m.name}”? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      setDeletingId(m.id!);
      await deleteMeetingById(m);
      if (openId === m.id) setOpenId(null); // cerrar panel si era ese
    } catch {
      alert("No se pudo eliminar la reunión. Intenta de nuevo.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenManual = (m: Meeting) => {
    if (m.status !== "completed") return; // guard-rail
    setManualTarget(m);
    setManualOpen(true);
  };

  // 1) Helpers arriba del componente (mantenelos cerca del resto)
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const sortKey = (m: Meeting) => {
    const iso = m.endAt ?? m.startAt;
    const t = Date.parse(iso ?? "");
    return Number.isFinite(t) ? t : 0;
  };

  const filtered = useMemo(() => {
    const q = normalize(searchTerm.trim());
    if (!q) return meetingsByClientItem;

    const tokens = q.split(/\s+/).filter(Boolean);

    return meetingsByClientItem.filter((m) => {
      const fields: Array<string | undefined> = [
        m.name,
        m.status,
        m.type === "google-meet" ? "google meet" : "presencial",
        m.location,
        m.notes,
        m.startAt,
        m.endAt,
        // participantes: nombre y email
        ...(m.participants?.flatMap((p) => [p.name, p.email]) ?? []),
      ];

      const haystack = normalize(fields.filter(Boolean).join(" "));
      return tokens.every((t) => haystack.includes(t));
    });
  }, [searchTerm, meetingsByClientItem]);

  const scheduled = useMemo(
    () =>
      filtered
        .filter((m) => m.status === "scheduled")
        .slice()
        .sort((a, b) => sortKey(a) - sortKey(b)), // ↑ más cercana primero
    [filtered]
  );
  const completed = useMemo(
    () =>
      filtered
        .filter((m) => m.status === "completed")
        .slice()
        .sort((a, b) => sortKey(b) - sortKey(a)),
    [filtered]
  );
  const canceled = useMemo(
    () =>
      filtered
        .filter((m) => m.status === "canceled")
        .slice()
        .sort((a, b) => sortKey(b) - sortKey(a)),
    [filtered]
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
                  onDelete={handleDelete}
                  deleting={deletingId === m.id}
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
                  onDelete={handleDelete}
                  deleting={deletingId === m.id}
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
        onEdit={handleOpenEdit}
        onCancel={(m) => handleCancel(m)}
        canceling={cancellingId === openId}
        onComplete={handleComplete}
        completing={completingId === openId}
        onManualTime={handleOpenManual}
      />
      <EditMeetingModal
        open={editOpen && !!(selected ?? openMeeting)}
        onOpenChange={setEditOpen}
        meeting={selected ?? openMeeting ?? null}
        onConfirm={handleConfirmEdit}
        loading={savingEdit}
      />
      <ManualTimeDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        meeting={manualTarget}
        lawyerId={lawyer?.id}
        clientId={clientItemDetail?.clientId}
        clientItemId={clientItemId}
        onSaved={() => {
          // opcional: toast o refrescar stats del cliente
          toast?.({ title: "Tiempo cargado" });
        }}
      />
    </div>
  );
};
export default ItemMeetingsPage;
