// src/pages/dashboard/items/ItemProcessPage.tsx
import ProcessCard from "@/components/processes/ProcessCard";
import ProcessForm from "@/components/processes/ProcessForm";
import { useProcessStore } from "@/store/useProcessStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import RowSkeleton from "@/components/shared/RowSkeleton";

const ItemProcessPage = () => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processesByClientItem = useProcessStore((s) => s.processesByClientItem);
  const fetchProcessesByClientItemId = useProcessStore(
    (s) => s.fetchProcessesByClientItemId
  );
  const setProcessesByClientItem = useProcessStore(
    (s) => s.setProcessesByClientItem
  );

  const filtered = processesByClientItem.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!clientItemId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchProcessesByClientItemId(clientItemId);
      } catch (e) {
        setError("No se pudieron cargar los trámites");
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      setProcessesByClientItem([]);
    };
  }, [clientItemId, fetchProcessesByClientItemId, setProcessesByClientItem]);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  return (
    <div>
      <ProcessForm
        isDialogOpen={isDialogOpen}
        onOpenChange={handleOpenChange}
      />
      <div className="flex flex-col gap-y-4 pl-2 pt-2">
        <h1 className="text-3xl font-semibold leading-tight">Trámites</h1>
        <div className="flex">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar tramites"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-800"
            >
              Nuevo trámite
            </Button>
          </div>
        </div>
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
          {/* LOADING */}
          {loading && (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* EMPTY (sin datos) */}
          {!loading && !error && processesByClientItem.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">
                Aún no hay trámites para este ítem.
              </p>
              <Button
                className="mt-3 bg-blue-800"
                onClick={() => setIsDialogOpen(true)}
              >
                Crear el primer trámite
              </Button>
            </div>
          )}

          {/* NO MATCH (hay datos, pero no coinciden con la búsqueda) */}
          {!loading &&
            !error &&
            processesByClientItem.length > 0 &&
            filtered.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-gray-600">
                  No se encontraron trámites que coincidan con “{searchTerm}”.
                </p>
              </div>
            )}

          {!loading && !error && filtered.length > 0 && (
            <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
              <div className="grid grid-cols-[1fr_2fr_3fr_1fr] pl-10 py-3 gap-x-5 font-medium">
                <p>Fecha</p>
                <p>Nombre</p>
                <p>Descripción</p>
                <p>Duración</p>
              </div>
              {filtered.map((p) => (
                <ProcessCard key={p.id} p={p} />
              ))}
            </ul>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ItemProcessPage;
