import AudienceForm from "@components/audiences/AudienceForm";
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
import { Ellipsis, ScrollText, Search } from "lucide-react";
import React, { useState } from "react";

const mockAudiences = [
  {
    id: "aud-1",
    title: "Audiencia Preliminar",
    date: "2024-04-15",
    pages: 12,
    outcome: "Continua",
    pdfUrl: "/mock/audiencia-preliminar.pdf",
  },
  {
    id: "aud-2",
    title: "Audiencia de Juicio",
    date: "2024-04-03",
    pages: 43,
    outcome: "Pendiente",
    pdfUrl: "/mock/audiencia-juicio.pdf",
  },
  {
    id: "aud-3",
    title: "Audiencia de Conciliación",
    date: "2024-03-20",
    pages: 8,
    outcome: "Archivada",
    pdfUrl: "/mock/audiencia-conciliacion.pdf",
  },
];

const ItemAudiencesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

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
          {mockAudiences.map((aud) => (
            <li key={aud.id} className="p-4">
              {/* fila */}
              <div className="flex items-center gap-4">
                {/* ícono */}
                <div className="shrink-0">
                  <ScrollText />
                </div>

                {/* contenido */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 mb-1">
                    {aud.title}
                  </p>
                  <p className=" text-[0.9rem] text-gray-500 grid items-center grid-cols-[15rem_10rem] gap-x-6">
                    <span className="justify-self-start tabular-nums">
                      {`${aud.pages} paginas`}
                    </span>
                    <span className="justify-self-end tabular-nums">
                      {formatDate(aud.date)}
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

export default ItemAudiencesPage;
