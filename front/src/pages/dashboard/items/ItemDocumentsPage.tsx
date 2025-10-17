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
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import DocumentCard from "@/components/documents/DocumentCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import RowSkeleton from "@/components/shared/RowSkeleton";

const ItemDocumentsPage = () => {
  const { clientItemId } = useParams<{ clientItemId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  /*   const [tagFilter, setTagFilter] = useState<string>(""); */
  const [clientOrder, setClientOrder] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  function openInViewer(docs: Document[], activeId?: string) {
    window.viewer?.open?.({ docs, activeId: activeId ?? null });
  }

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
            </>
          ) : (
            <>
              {documentsByClientItem.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  openInViewer={openInViewer}
                />
              ))}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ItemDocumentsPage;
