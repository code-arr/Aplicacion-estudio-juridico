import { useEffect, useState } from "react";
import type { Audience } from "@/types/Audience";
import { useAudienceStore } from "@/store/useAudienceStore";
import AudienceForm from "@/components/audiences/AudienceForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePlus2, Search } from "lucide-react";
import { useParams } from "react-router-dom";
import AudienceCard from "@/components/audiences/AudienceCard";
import RowSkeleton from "@/components/shared/RowSkeleton";
import RenameAudienceModal from "@/components/audiences/RenameAudienceModal";
import { updateAudience } from "@/api/audience";
import { useToast } from "@/hooks/useToast";

function EmptyItemAudiences() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(210,100%,95%)] mb-4">
        <FilePlus2 className="w-8 h-8 text-[hsl(210,100%,40%)]" />
      </div>

      <h3 className="text-lg font-semibold text-[hsl(225,15%,15%)]">
        No se encontraron audiencias.
      </h3>
    </div>
  );
}

const ItemAudiencesPage = () => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { toast } = useToast?.() ?? { toast: () => {} };

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Audience | null>(null);
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audiencesByClientItem = useAudienceStore(
    (s) => s.audiencesByClientItem
  );
  const fetchAudiencesByClientItemId = useAudienceStore(
    (s) => s.fetchAudiencesByClientItemId
  );
  const setAudiencesByClientItem = useAudienceStore(
    (s) => s.setAudiencesByClientItem
  );
  const deleteAudienceById = useAudienceStore((s) => s.deleteAudienceById);

  useEffect(() => {
    if (!clientItemId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchAudiencesByClientItemId(clientItemId);
      } catch (e) {
        setError("No se pudieron cargar las audiencias");
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      setAudiencesByClientItem([]);
    };
  }, [clientItemId, fetchAudiencesByClientItemId, setAudiencesByClientItem]);

  const handleEdit = (aud: Audience) => {
    setSelected(aud);
    setEditOpen(true);
  };

  const handleConfirmRename = async (newName: string) => {
    if (!selected) return;
    const id = selected.id;

    // 1) optimistic
    const prev = audiencesByClientItem;
    const next = audiencesByClientItem.map((a) =>
      a.id === id ? { ...a, name: newName } : a
    );
    setAudiencesByClientItem(next);

    try {
      setSaving(true);
      await updateAudience(id, newName);
      toast?.({ title: "Nombre actualizado" });
      setEditOpen(false);
      setSelected(null);
    } catch (err: any) {
      // 2) rollback
      setAudiencesByClientItem(prev);
      toast?.({
        title: "No se pudo actualizar",
        description: err?.response?.data?.message ?? "Probá de nuevo",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (aud: Audience) => {
    const ok = window.confirm(
      `¿Eliminar “${aud.name}”? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      setDeletingId(aud.id);
      await deleteAudienceById(aud);
      // 👇 cerrar pestaña del visor si existía (no rompe si no está)
      window.audienceViewer?.closeById?.(aud.id);
    } catch {
      alert("No se pudo eliminar la audiencia. Intenta de nuevo.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  function openInViewer(audiences: Audience[], activeId?: string) {
    window.audienceViewer?.open?.({
      audiences,
      activeId: activeId ?? null,
    });
  }

  const isEmpty =
    !loading &&
    !error &&
    Array.isArray(audiencesByClientItem) &&
    audiencesByClientItem.length === 0;

  const filteredAudiences = Array.isArray(audiencesByClientItem)
    ? audiencesByClientItem.filter((aud) => {
        const matchesSearch = aud.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

        return matchesSearch;
      })
    : [];

  return (
    <div>
      <AudienceForm
        isDialogOpen={isDialogOpen}
        onOpenChange={handleOpenChange}
      />
      <div className="flex flex-col gap-y-4">
        <h1 className="text-3xl font-semibold leading-tight">Audiencias</h1>
        <div className="flex">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar audiencias"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-800"
            >
              Subir audiencia
            </Button>
          </div>
        </div>
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200 mt-2">
          {loading ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : error ? (
            <li className="p-6 text-[hsl(0,70%,40%)]">{error}</li>
          ) : isEmpty ? (
            <li className="p-2">
              <EmptyItemAudiences />
            </li>
          ) : (
            <>
              {filteredAudiences.length > 0 ? (
                filteredAudiences.map((aud) => (
                  <AudienceCard
                    key={aud.id}
                    aud={aud}
                    openInViewer={openInViewer}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    deleting={deletingId === aud.id}
                  />
                ))
              ) : (
                <EmptyItemAudiences />
              )}
              <RenameAudienceModal
                open={editOpen}
                onOpenChange={setEditOpen}
                initialName={selected?.name ?? ""}
                onConfirm={handleConfirmRename}
                loading={saving}
              />
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ItemAudiencesPage;
