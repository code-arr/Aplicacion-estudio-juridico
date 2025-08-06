import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ClientHeaderProps {
  client: {
    firstName?: string;
    lastName?: string;
    rut?: string;
  };
  onBack?: () => void;
  timer?: string;
}

const ClientHeader = ({
  client,
  onBack,
  timer = "00:00",
}: ClientHeaderProps) => {
  const initials = `${client.firstName?.charAt(0) ?? ""}${
    client.lastName?.charAt(0) ?? ""
  }`.toUpperCase();

  return (
    <div className="bg-[hsl(210,100%,45%)] law-gradient text-white p-6 shadow-md">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className=" text-white hover:bg-white/10 p-2"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-[hsl(210,40%,98%)] text-[hsl(210,100%,45%)] font-semibold text-lg gap-x-[0.05rem]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{`${client?.firstName} ${client?.lastName}`}</h2>
            <p className="text-base text-white/80">{client?.rut}</p>
          </div>
        </div>
        <div className="ml-auto bg-white text-[hsl(225,15%,15%)] rounded px-3 py-2 flex items-center gap-2 text-xl font-semibold shadow-sm">
          {/* {formatTimeFromSeconds(simulatedTime)} */} {timer}
          <span className="w-3 h-3 ml-0.5 bg-yellow-400 rounded-full shadow-[0_0_6px_3px_rgba(250,204,21,0.6)]" />
        </div>
      </div>
    </div>
  );
};

export default ClientHeader;
