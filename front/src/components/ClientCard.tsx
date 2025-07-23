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
  const getStatusBadge = (status: Client["caseStatus"]) => {
    const statusConfig = {
      activo: {
        label: "Activo",
        className: "case-status-active",
      },
      en_revision: {
        label: "En Revisión",
        className: "case-status-review",
      },
      cerrado: {
        label: "Cerrado",
        className: "case-status-closed",
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
                <AvatarImage src={client.profileImage} alt={client.fullName} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(client.fullName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {client.fullName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{client.caseType}</p>
            </div>
          </div>
          {getStatusBadge(client.caseStatus)}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Última actualización</p>
            <p className="text-sm text-gray-700 font-medium">
              {client.lastUpdate}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(client)}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
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
