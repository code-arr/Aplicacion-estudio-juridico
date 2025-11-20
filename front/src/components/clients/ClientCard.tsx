import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight } from "lucide-react";
import type { Client } from "@/types/Client";
import { formatDateChileShort } from "@/lib/formatDate";

interface ClientCardProps {
  client: Client;
  onViewDetails: (client: Client) => void;
}

const ClientCard = ({ client, onViewDetails }: ClientCardProps) => {
  const getStatusBadge = (status: Client["status"]) => {
    const statusConfig = {
      active: {
        label: "Activo",
        className:
          "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
      },
      under_review: {
        label: "En Revisión",
        className:
          "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
      },
      inactive: {
        label: "Inactivo",
        className:
          "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
      },
    };

    const config = statusConfig[status!];
    return (
      <Badge className={`${config.className} font-medium cursor-default`}>
        {config.label}
      </Badge>
    );
  };

  function getDisplayName(client: Client) {
    return client.type === "Juridica"
      ? client.companyName
      : formatPersonName(client.firstName ?? "", client.lastName ?? "");
  }

  function formatPersonName(first: string, last: string) {
    // Si el apellido tiene espacios, cortamos al primero (como hacías)
    const firstLast = last?.includes(" ")
      ? last.slice(0, last.indexOf(" "))
      : last;
    return `${first} ${firstLast}`.trim();
  }

  function getAvatarInitials(client: Client) {
    if (client.type === "Juridica") {
      // Tomá primeras letras de cada palabra (máx 2)
      /*       const companyName = client.companyName ?? "";
      const parts = companyName.trim().split(/\s+/);
      const initials = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? ""); */
      return <Building2 />;
    } else {
      const a = (client.firstName?.[0] ?? "").toUpperCase();
      const b = (client.lastName?.[0] ?? "").toUpperCase();
      return a + b || "P";
    }
  }

  function getAvatarAlt(client: Client) {
    return client.type === "Juridica"
      ? `Logo ${client.companyName}`
      : `${client.firstName} ${client.lastName}`;
  }

  const getInitials = (name?: string) => {
    if (!name) return "?"; // fallback si no hay nombre
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 bg-white">
      <CardHeader className="pb-3">
        {/* Agregamos gap-3 para asegurar aire entre el nombre y el badge */}
        <div className="flex items-start justify-between gap-3">
          {/* GRUPO IZQUIERDO (Avatar + Texto) */}
          {/* flex-1: Ocupa todo el ancho disponible */}
          {/* min-w-0: Habilita que el texto adentro se pueda cortar (MAGIA) */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 shrink-0">
              {" "}
              {/* shrink-0 para que el avatar no se aplaste */}
              {client.profileImage ? (
                <AvatarImage
                  src={client.profileImage}
                  alt={getAvatarAlt(client)}
                />
              ) : (
                <AvatarFallback className="bg-[hsl(210,100%,45%)] text-[hsl(210,40%,98%)] font-semibold">
                  {getAvatarInitials(client)}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex flex-col min-w-0">
              {" "}
              {/* min-w-0 otra vez para el contenedor de texto directo */}
              <h3
                className="font-semibold text-gray-900 text-lg leading-tight truncate"
                title={getDisplayName(client)}
              >
                {getDisplayName(client)}
              </h3>
              {/* Agregamos truncate al RUT también por si acaso */}
              <p className="text-sm text-gray-600 mt-1 truncate">
                {client.rut}
              </p>
            </div>
          </div>

          {/* GRUPO DERECHO (Badge) */}
          {/* shrink-0: "Ni se te ocurra achicarte o moverte" */}
          <div className="shrink-0">{getStatusBadge(client.status)}</div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Última actividad</p>
            <p className="text-sm text-gray-700 font-medium">
              {formatDateChileShort(client.updatedAt!)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(client)}
            className="hover:bg-[hsl(210,100%,45%)] hover:text-[hsl(210,40%,98%)] transition-colors"
          >
            Ver detalles
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
