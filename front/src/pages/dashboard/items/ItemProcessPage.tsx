import ProcessCard from "@/components/processes/ProcessCard";
import ProcessForm from "@/components/processes/ProcessForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Process } from "@/types/Process";
import { Search } from "lucide-react";
import { useState } from "react";

const ItemProcessPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  const processes: Process[] = [
    {
      id: "proc_001",
      name: "Presentación en juzgado",
      description: "Entrega de documentos para el caso civil",
      durationSec: null, // aún no marcado como hecho
      dateTime: "2025-08-20",
    },
    {
      id: "proc_002",
      name: "Entrega de copias certificadas",
      description: "En Registro Civil N° 2",
      durationSec: 30, // en minutos
      dateTime: "2025-08-21",
    },
    {
      id: "proc_003",
      name: "Retiro de cédula",
      description: "Recoger cédula en tribunal",
      durationSec: 75,
      dateTime: "2025-08-22",
    },
    {
      id: "proc_004",
      name: "Firma de contrato",
      description: "Firma de contrato de arrendamiento",
      durationSec: 60,
      dateTime: "2025-08-23",
    },
    {
      id: "proc_005",
      name: "Gestión en escribanía",
      description: "Presentar escritura pública para protocolización",
      durationSec: 90,
      dateTime: "2025-08-24",
    },
    {
      id: "proc_006",
      name: "Retiro de oficios",
      description: "Retirar oficios firmados en el juzgado comercial",
      durationSec: 20,
      dateTime: "2025-08-25",
    },
    {
      id: "proc_007",
      name: "Presentación en municipalidad",
      description: "Ingreso de solicitud de patente comercial",
      durationSec: null,
      dateTime: "2025-08-26",
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
            <ProcessCard key={p.id} p={p} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ItemProcessPage;
