import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useLawyerStore } from "@/store/useLawyerStore";
import { googleConnect } from "@/api/user";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Switch } from "@components/ui/switch";
import googleLogo from "@/assets/logos/google.png";

const Settings = () => {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const lawyer = useLawyerStore((s) => s.lawyer);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    if (user?.googleEmail) setIsGoogleConnected(true);
    console.log(isGoogleConnected);
  }, [user?.googleEmail, isGoogleConnected]);

  const handleGoogleConnect = async () => {
    setIsLoading(true);
    if (token && user) await googleConnect(token, user.email);
    setIsLoading(false);
  };

  const handleEditProfile = () => {
    navigate("edit-profile");
  };

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
    <div className="px-40 py-3 pr-56 bg-gradient-to-t from-[#334155] via-[#3b4d66] to-[#60a5fa]/20 min-h-screen">
      <div className="mb-5">
        <h1 className="pb-1 text-3xl font-bold text-gray-900">
          {/*   ⚙️  */}Configuración
        </h1>
        <p className="pl-0.5 text-[1.25rem] text-gray-600">
          Preferencias y ajustes personales
        </p>
      </div>
      <Card className="px-3 py-2 border-none shadow-none">
        <div className="text-[hsl(225,15%,15%)] ">
          <CardHeader className="flex-row justify-between pb-4">
            <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Card className="flex flex-row items-center justify-between px-6 py-4 border-2 border-gray-200 shadow-none">
              <div className="flex items-center gap-5">
                <Avatar className="h-16 w-16 mb-4">
                  <AvatarFallback className="bg-[hsl(210,100%,45%)] text-[hsl(210,40%,98%)] text-2xl">
                    {getInitials(lawyer?.firstName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 text-base">
                  <div>
                    <p className="text-lg font-semibold">
                      {lawyer?.lastName.includes(" ")
                        ? lawyer?.firstName +
                          " " +
                          lawyer?.lastName.slice(
                            0,
                            lawyer?.lastName.indexOf(" ")
                          )
                        : lawyer?.firstName + " " + lawyer?.lastName}
                    </p>
                    <p>{user?.email}</p>
                  </div>
                  <div>
                    <p>Estado de la cuenta: Activo</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleEditProfile}
                className="text-base font-normal cursor-pointer"
              >
                Editar perfil
              </Button>
            </Card>
          </CardContent>
        </div>
        <div>
          <CardHeader className="flex-row justify-between pb-4 pt-1">
            <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col border-2 border-gray-200 rounded-lg divide-y divide-gray-200 py-1">
              {/* Recordatorios de plazos */}
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-[hsl(225,15%,15%)]">
                    Recordatorios de plazos
                  </p>
                  <p className="text-sm text-gray-500">
                    Recibí avisos antes de cada vencimiento.
                  </p>
                </div>
                <Switch
                  className="bg-slate-200"
                  checked={true}
                  onCheckedChange={(val) => {
                    /* toggle en store */
                  }}
                />
              </div>

              {/* Nuevas tareas asignadas */}
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-[hsl(225,15%,15%)]">
                    Nuevas tareas asignadas
                  </p>
                  <p className="text-sm text-gray-500">
                    Cuando otro abogado te delega una tarea.
                  </p>
                </div>
                <Switch
                  className="bg-slate-200"
                  checked={false}
                  onCheckedChange={(val) => {
                    /* toggle en store */
                  }}
                />
              </div>

              {/* Avisos de audiencias */}
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-[hsl(225,15%,15%)]">
                    Avisos de audiencias
                  </p>
                  <p className="text-sm text-gray-500">
                    Notificación cuando se programe una audiencia.
                  </p>
                </div>
                <Switch
                  className="bg-slate-200"
                  checked={true}
                  onCheckedChange={(val) => {
                    /* toggle en store */
                  }}
                />
              </div>
            </div>
          </CardContent>
        </div>
        <div className="flex">
          <div>
            <CardHeader className="flex-row justify-between pb-4 pt-1">
              <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <div className="flex flex-col border-2 border-gray-200 rounded-lg divide-y divide-gray-200 py-1">
                {/* Cambiar contraseña */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="font-normal text-[hsl(210,100%,40%)] hover:underline cursor-pointer">
                      Cambiar contraseña
                    </p>
                  </div>
                </div>

                {/* Último inicio de sesión */}
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium text-[hsl(225,15%,15%)]">
                      Último inicio de sesión
                    </p>
                    <p className="text-sm text-gray-500">
                      Último acceso: 08/08/2025 18:23 desde IP 190.11.22.33
                      (Mendoza, Argentina)
                    </p>
                  </div>
                </div>

                {/* Verificación en dos pasos */}
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium text-[hsl(225,15%,15%)]">
                      Verificación en dos pasos (2FA)
                    </p>
                    <p className="text-sm text-gray-500">
                      Recibir código al iniciar sesión desde un nuevo
                      dispositivo.
                    </p>
                  </div>
                  <Switch
                    className="bg-slate-200 ml-3"
                    checked={true}
                    onCheckedChange={(val) => {
                      /* toggle en store */
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </div>
          <div className="flex flex-col min-w-[35%]">
            <div>
              <CardHeader className="flex-row justify-between pb-4 pt-1">
                <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
                  Gestión de tiempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col w-fit border-2 border-gray-200 rounded-lg divide-y divide-gray-200">
                  {/* Recordatorios de plazos */}
                  <div className="flex items-center justify-between p-3 py-2">
                    <p className="font-normal text-[hsl(225,15%,15%)]">
                      Valor por hora: $150.000 CLP
                    </p>
                  </div>
                </div>
              </CardContent>
            </div>
            <div>
              <CardHeader className="flex-row justify-between pb-4 pt-1">
                <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
                  Integración
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col w-fit border-2 border-gray-200 rounded-lg divide-y divide-gray-200">
                  <button
                    onClick={handleGoogleConnect}
                    disabled={isLoading || isGoogleConnected}
                    className="flex items-center justify-between p-3 py-2 gap-x-2 shadow-sm hover:shadow-md cursor-pointer disabled:cursor-default disabled:shadow-sm"
                  >
                    <img
                      src={googleLogo}
                      alt="Logo de Google"
                      className="w-5 h-5"
                    />
                    <span className="font-medium text-gray-800">
                      {!isGoogleConnected
                        ? isLoading
                          ? "Conectando..."
                          : "Conectar con Google"
                        : "Conectado"}
                    </span>
                  </button>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
