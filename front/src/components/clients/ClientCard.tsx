import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import type { Client } from "@/types/Client";

interface ClientCardProps {
  client: Client;
  onViewDetails: (client: Client) => void;
}

const ClientCard = ({ client, onViewDetails }: ClientCardProps) => {
  const getStatusBadge = (status: Client["clientStatus"]) => {
    const statusConfig = {
      activo: {
        label: "Activo",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      en_revision: {
        label: "En Revisión",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      inactivo: {
        label: "Inactivo",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
    };

    const config = statusConfig[status];
    return (
      <Badge className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
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
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {client.profileImage ? (
                <AvatarImage src={client.profileImage} alt={client.firstName} />
              ) : (
                <AvatarFallback className="bg-[hsl(210,100%,45%)] text-[hsl(210,40%,98%)] font-semibold">
                  {getInitials(client.firstName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {client.firstName +
                  " " +
                  client.lastName.slice(0, client.lastName.indexOf(" "))}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{client.dni}</p>
            </div>
          </div>
          {getStatusBadge(client.clientStatus)}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Última actualización</p>
            <p className="text-sm text-gray-700 font-medium">
              {client.updatedAt}
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
