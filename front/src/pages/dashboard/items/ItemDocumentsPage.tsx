import DocumentForm from "@components/documents/DocumentForm";
import { Button } from "@components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdownMenu";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Ellipsis, FileIcon, Search } from "lucide-react";
import { useState } from "react";

const documents = [
  {
    id: "1",
    title: "Contrato de arrendamiento.pdf",
    type: "pdf",
    sizeBytes: 2048000, // 2 MB
    uploadedAt: "2025-08-10T14:32:00Z",
    uploadedBy: { id: "u1", name: "Juan Pérez" },
    tags: ["Contrato"],
    visibility: "team",
    url: "#",
  },
  {
    id: "2",
    title: "Evidencia_pericia.png",
    type: "image",
    sizeBytes: 1250000, // 1.2 MB
    uploadedAt: "2025-08-09T11:10:00Z",
    uploadedBy: { id: "u2", name: "María López" },
    tags: ["Evidencia"],
    visibility: "private",
    url: "#",
  },
  {
    id: "3",
    title: "Demanda laboral.docx",
    type: "docx",
    sizeBytes: 850000, // 0.85 MB
    uploadedAt: "2025-08-08T09:45:00Z",
    uploadedBy: { id: "u3", name: "Estudio ACME SA" },
    tags: ["Demanda"],
    visibility: "public",
    url: "#",
  },
];

const ItemDocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [clientOrder, setClientOrder] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function formatSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  return (
    <div>
      <DocumentForm
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
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
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="evidence">Evidencia</SelectItem>
                <SelectItem value="demand">Demanda</SelectItem>
              </SelectContent>
            </Select>
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
          {documents.map((doc) => (
            <li key={doc.id} className="p-4">
              {/* fila */}
              <div className="flex items-center gap-4">
                {/* ícono */}
                <div className="shrink-0">
                  {" "}
                  <FileIcon />
                </div>

                {/* contenido */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 mb-1">
                    {doc.title}
                  </p>
                  <p className=" text-[0.9rem] text-gray-500 grid items-center grid-cols-[18rem_10rem_15rem] gap-x-6">
                    <span className="truncate">{doc.tags.join(" - ")}</span>
                    <span className="justify-self-center tabular-nums">
                      {formatSize(doc.sizeBytes)}
                    </span>
                    <span className="justify-self-end tabular-nums">
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </p>
                </div>

                {/* acciones */}
                <div className="flex items-center gap-2 gap-x-4">
                  <button className="text-blue-700 cursor-pointer">Ver</button>
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="Opciones del ítem"
                        className="p-1.5 rounded-md hover:bg-gray-100 leading-none"
                      >
                        <Ellipsis className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      size="1"
                      variant="soft"
                      align="end"
                      sideOffset={6}
                    >
                      <DropdownMenuItem
                        onSelect={() => onViewDetails(item)}
                        shortcut="Enter"
                      >
                        Ver detalles
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => {
                          // Abrí tu modal de edición o navegá a la ruta de edición
                          // openEditModal(item.id) / navigate(...)
                        }}
                        shortcut="⌘ E"
                      >
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onSelect={() => {
                          // Confirmación y borrado
                          // confirmDelete(item.id)
                        }}
                        color="crimson"
                        shortcut="⌘ ⌫"
                      >
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuRoot>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ItemDocumentsPage;
