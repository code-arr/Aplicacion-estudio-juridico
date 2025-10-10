import { useEffect, useState } from "react";
import type { Audience } from "@/types/Audience";
import { useAudienceStore } from "@/store/useAudienceStore";
import AudienceForm from "@/components/audiences/AudienceForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useParams } from "react-router-dom";
import AudienceCard from "@/components/audiences/AudienceCard";

const ItemAudiencesPage = () => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audiencesByClientItem = useAudienceStore(
    (s) => s.audiencesByClientItem
  );
  const fetchAudiencesByClientItemId = useAudienceStore(
    (s) => s.fetchAudiencesByClientItemId
  );

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
  }, [clientItemId, fetchAudiencesByClientItemId]);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  function openInViewer(audiences: Audience[], activeId?: string) {
    window.audienceViewer?.open?.({
      audiences,
      activeId: activeId ?? null,
    });
  }

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
          {audiencesByClientItem.map((aud) => (
            <AudienceCard key={aud.id} aud={aud} openInViewer={openInViewer} />
          ))}
          {loading && <li className="p-4 text-gray-500">Cargando…</li>}
        </ul>
      </div>
    </div>
  );
};

export default ItemAudiencesPage;
