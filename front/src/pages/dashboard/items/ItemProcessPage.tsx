import ProcessForm from "@components/processes/ProcessForm";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes && minutes !== 0) return "—"; // si es null o undefined
  if (minutes === 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${remainingMinutes}m`;
  }
}

const ItemProcessPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  const processes = [
    {
      id: "proc_001",
      name: "Presentación en juzgado",
      description: "Entrega de documentos para el caso civil",
      duration: null, // aún no marcado como hecho
      date: "2025-08-20",
    },
    {
      id: "proc_002",
      name: "Entrega de copias certificadas",
      description: "En Registro Civil N° 2",
      duration: 30, // en minutos
      date: "2025-08-21",
    },
    {
      id: "proc_003",
      name: "Retiro de cédula",
      description: "Recoger cédula en tribunal",
      duration: 75,
      date: "2025-08-22",
    },
    {
      id: "proc_004",
      name: "Firma de contrato",
      description: "Firma de contrato de arrendamiento",
      duration: 60,
      date: "2025-08-23",
    },
    {
      id: "proc_005",
      name: "Gestión en escribanía",
      description: "Presentar escritura pública para protocolización",
      duration: 90,
      date: "2025-08-24",
    },
    {
      id: "proc_006",
      name: "Retiro de oficios",
      description: "Retirar oficios firmados en el juzgado comercial",
      duration: 20,
      date: "2025-08-25",
    },
    {
      id: "proc_007",
      name: "Presentación en municipalidad",
      description: "Ingreso de solicitud de patente comercial",
      duration: null,
      date: "2025-08-26",
    },
  ];
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
          <div className="grid grid-cols-[1fr_2fr_3fr_1fr] pl-10 py-3 font-medium">
            <p>Fecha</p>
            <p>Nombre</p>
            <p>Descripción</p>
            <p>Duración</p>
          </div>
          {processes.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_2fr_3fr_1fr] pl-10 py-3"
            >
              <p>{p.date}</p>
              <p>{p.name}</p>
              <p>{p.description}</p>
              <p>{formatDuration(p.duration)}</p>
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ItemProcessPage;
