// src/pages/dashboard/items/ItemDocumentsPage.tsx
import { useParams } from "react-router-dom";
import type { Document } from "@/types/Document";
import { useDocumentStore } from "@/store/useDocumentStore";
import DocumentForm from "@/components/documents/DocumentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilePlus2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import DocumentCard from "@/components/documents/DocumentCard";
import RowSkeleton from "@/components/shared/RowSkeleton";

function EmptyItemDocuments() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(210,100%,95%)] mb-4">
        <FilePlus2 className="w-8 h-8 text-[hsl(210,100%,40%)]" />
      </div>

      <h3 className="text-lg font-semibold text-[hsl(225,15%,15%)]">
        No se encontraron documentos.
      </h3>
    </div>
  );
}

const ItemDocumentsPage = () => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  /*   const [tagFilter, setTagFilter] = useState<string>(""); */
  const [clientOrder, setClientOrder] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentsByClientItem = useDocumentStore(
    (s) => s.documentsByClientItem
  );
  const fetchDocumentsByClientItemId = useDocumentStore(
    (s) => s.fetchDocumentsByClientItemId
  );
  const setDocumentsByClientItem = useDocumentStore(
    (s) => s.setDocumentsByClientItem
  );
  const deleteDocumentById = useDocumentStore((s) => s.deleteDocumentById);

  useEffect(() => {
    if (!clientItemId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchDocumentsByClientItemId(clientItemId);
      } catch (e) {
        setError("No se pudieron cargar los documentos");
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      setDocumentsByClientItem([]);
    };
  }, [clientItemId, fetchDocumentsByClientItemId, setDocumentsByClientItem]);

  const handleDelete = async (doc: Document) => {
    const ok = window.confirm(
      `¿Eliminar “${doc.name}”? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      setDeletingId(doc.id);
      await deleteDocumentById(doc);
      // cerrar pestaña del visor si existía (si implementaste closeById)
      window.viewer?.closeById?.(doc.id);
    } catch {
      alert("No se pudo eliminar el documento.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  function openInViewer(docs: Document[], activeId?: string) {
    window.viewer?.open?.({ docs, activeId: activeId ?? null });
  }

  const isEmpty =
    !loading &&
    !error &&
    Array.isArray(documentsByClientItem) &&
    documentsByClientItem.length === 0;

  const filteredDocuments = Array.isArray(documentsByClientItem)
    ? documentsByClientItem.filter((doc) => {
        const matchesSearch =
          doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tags?.some((t) =>
            t.toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesType = typeFilter ? doc.type === typeFilter : true;

        return matchesSearch && matchesType;
      })
    : [];

  return (
    <div>
      <DocumentForm
        isDialogOpen={isDialogOpen}
        onOpenChange={handleOpenChange}
      />
      <div className="flex flex-col gap-y-4">
        <h1 className="text-3xl font-semibold leading-tight">Documentos</h1>
        <div className="flex">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar documentos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
              </SelectContent>
            </Select>
            {/*             <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="evidence">Evidencia</SelectItem>
                <SelectItem value="demand">Demanda</SelectItem>
              </SelectContent>
            </Select> */}
            <Select value={clientOrder} onValueChange={setClientOrder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fecha_ascendente">
                  Fecha Ascendente
                </SelectItem>
                <SelectItem value="fecha_descendente">
                  Fecha Descendente
                </SelectItem>
                <SelectItem value="alfabetico">Alfabetico</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-800"
            >
              Subir documentos
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
              <EmptyItemDocuments />
            </li>
          ) : (
            <>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    openInViewer={openInViewer}
                    onDelete={handleDelete}
                    deleting={deletingId === doc.id}
                  />
                ))
              ) : (
                <EmptyItemDocuments />
              )}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ItemDocumentsPage;
