// pages/dashboard/lawyer/settings/LawyerSettings.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useLawyerStore } from "@/store/useLawyerStore";
import { getRecentLogins, googleConnect } from "@/api/user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import googleLogo from "@/assets/logos/google.png";
import ChangePasswordDialog from "@/components/lawyer/ChangePasswordDialog";
import { useFocusContext } from "@/hooks/useFocusContext";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Info,
  KeyRound,
  Link2,
  Loader2,
  LogIn,
  PauseCircle,
  Pencil,
} from "lucide-react";
import type { LoginEntry } from "@/types/LoginEntry";

function parseUA(ua?: string) {
  if (!ua) return "Dispositivo";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Dispositivo";
}

const Settings = () => {
  useFocusContext({ type: "LawyerApp", id: "main" });

  const navigate = useNavigate();

  const [pwdOpen, setPwdOpen] = useState(false);
  /*   const [pwdStep, setPwdStep] = useState<"verify" | "set">("verify"); */
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [recentLogins, setRecentLogins] = useState<LoginEntry[]>([]);
  const [loginsLoading, setLoginsLoading] = useState(false);
  const [loginsError, setLoginsError] = useState<string | null>(null);

  console.log(recentLogins);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const lawyer = useLawyerStore((s) => s.lawyer);

  useEffect(() => {
    const run = async () => {
      try {
        setLoginsLoading(true);
        setLoginsError(null);

        if (!token) {
          setRecentLogins([]);
          return;
        }

        const data = await getRecentLogins(token);
        setRecentLogins(data);
      } catch {
        setLoginsError("No se pudieron cargar los inicios recientes");
        setRecentLogins([]);
      } finally {
        setLoginsLoading(false);
      }
    };
    run();
  }, [token]);

  useEffect(() => {
    if (user?.googleEmail) setIsGoogleConnected(true);
  }, [user?.googleEmail]);

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
            <Card className="flex flex-row items-start justify-between px-6 py-4 border-2 border-gray-200 shadow-none">
              {/* Avatar + info */}
              <div className="flex items-start gap-5">
                <Avatar className="h-16 w-16 mt-1">
                  <AvatarFallback className="bg-[hsl(210,100%,45%)] text-[hsl(210,40%,98%)] text-2xl">
                    {getInitials(lawyer?.firstName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-3 text-base">
                  {/* Nombre y correo */}
                  <div>
                    <p className="text-lg font-semibold">
                      {lawyer?.firstName} {lawyer?.lastName}
                    </p>
                    <p>{user?.email}</p>
                  </div>

                  {/* Estado */}
                  <p>Estado de la cuenta: Activo</p>

                  {/* Datos adicionales */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Teléfono: </span>
                      {lawyer?.phone}
                    </p>
                    <p>
                      <span className="font-medium">RUT: </span> {lawyer?.rut}
                    </p>
                    <p className="capitalize">
                      <span className="font-medium">Dirección: </span>
                      {lawyer?.adress}
                    </p>
                    <p className="capitalize">
                      <span className="font-medium">Tipo: </span>
                      {lawyer?.type ? lawyer?.type : "No especificado"}
                    </p>
                    <p className="capitalize">
                      <span className="font-medium">Seniority: </span>
                      {lawyer?.seniorityLevel}
                    </p>
                    <p>
                      <span className="font-medium">Gmail: </span>
                      {user?.googleEmail ? user.googleEmail : "No conectado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón editar */}
              <Button
                onClick={handleEditProfile}
                className="text-base font-normal cursor-pointer h-fit"
              >
                Editar perfil
              </Button>
            </Card>
          </CardContent>
        </div>

        {/* <div>
          <CardHeader className="flex-row justify-between pb-4 pt-1">
            <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col border-2 border-gray-200 rounded-lg divide-y divide-gray-200 py-1">
              {/* Recordatorios de plazos 
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
                    /* toggle en store }
                />
              </div>

              {/* Nuevas tareas asignadas 
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
                    /* toggle en store 
                  }
                />
              </div>

              {/* Avisos de audiencias
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
                    /* toggle en store 
                  }
                />
              </div>
            </div>
          </CardContent>
        </div> */}
        <div className="flex">
          <div>
            <CardHeader className="flex-row justify-between pb-4 pt-1">
              <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <div className="flex flex-col rounded-lg border border-gray-200 bg-white/70 shadow-sm divide-y divide-gray-200">
                {/* Cambiar contraseña */}
                <div className="flex items-center justify-between gap-x-2 p-3">
                  <div>
                    <p className="font-medium text-[hsl(225,15%,15%)]">
                      Contraseña
                    </p>
                    <p className="text-sm text-gray-500">
                      Recomendación: cambiala cada 90 días.
                    </p>
                  </div>

                  <Button
                    onClick={() => setPwdOpen(true)}
                    className="h-9 px-3 font-medium"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Cambiar contraseña
                  </Button>
                </div>

                {/* Accesos anteriores desde otros dispositivos (0..3) */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <LogIn className="h-4 w-4 text-gray-500" />
                    <p className="font-medium text-[hsl(225,15%,15%)]">
                      Inicios de sesión recientes
                    </p>
                  </div>

                  {loginsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 pl-6">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando…
                    </div>
                  ) : loginsError ? (
                    <div className="pl-6 text-sm text-red-600">
                      {loginsError}
                    </div>
                  ) : recentLogins.length === 0 ? (
                    <div className="pl-6 text-sm text-gray-600">
                      No hay accesos anteriores desde otros dispositivos.
                    </div>
                  ) : (
                    <ul className="pl-6 space-y-1">
                      {recentLogins.map((l) => (
                        <li key={l.id} className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">
                            {new Date(l.createdAt).toLocaleString()}
                          </span>{" "}
                          — IP {l.ip} — {parseUA(l.userAgent)}
                          {(l.city ||
                            l.region ||
                            l.country ||
                            l.countryCode) && (
                            <>
                              {" "}
                              (
                              {[l.city, l.region, l.country ?? l.countryCode]
                                .filter(Boolean)
                                .join(", ")}
                              )
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Verificación en dos pasos */}
                {/*                 <div className="flex items-center justify-between p-3">
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
                    onCheckedChange={(val) => {}}
                  />
                </div> */}
              </div>
            </CardContent>
            <div>
              <CardHeader className="flex-row justify-between pb-4 pt-1">
                <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
                  Integración
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col w-fit rounded-lg border border-gray-200 bg-white/70 shadow-sm">
                  {/* Google */}
                  <div className="flex items-center justify-between gap-4 p-3">
                    <div className="flex items-center gap-3">
                      <img src={googleLogo} alt="Google" className="w-5 h-5" />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">
                          Google
                        </span>
                        <span className="text-xs text-gray-600">
                          Calendario/Meet y envíos de correo.
                        </span>
                      </div>
                      {isGoogleConnected ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Conectado
                        </span>
                      ) : isLoading ? (
                        <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          Conectando…
                        </span>
                      ) : null}
                    </div>

                    {!isGoogleConnected && (
                      <Button
                        onClick={handleGoogleConnect}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Conectando…
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4 mr-2" />
                            Conectar con Google
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Email conectado (solo si hay) */}
                  {user?.googleEmail && (
                    <div className="px-3 pb-3 pt-0 text-xs text-gray-600">
                      Vinculado como{" "}
                      <span className="font-medium text-gray-800">
                        {user.googleEmail}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </div>
          <div className="flex flex-col min-w-[35%]">
            <div>
              <CardHeader className="flex-row justify-between pb-4 pt-1">
                <CardTitle className="flex items-center gap-2 font-medium tracking-[0.01em] text-[hsl(225,15%,15%)]">
                  Gestión de tiempo
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col w-fit rounded-lg border border-gray-200 bg-white/70 shadow-sm divide-y divide-gray-200">
                  {/* Valor por hora + estado */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-gray-500">
                          Valor por hora
                        </span>
                        <span className="text-lg font-semibold text-slate-800">
                          $150.000 CLP
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <Activity className="h-3.5 w-3.5 mr-1" />
                        Automático: Activo
                      </span>
                    </div>
                  </div>

                  {/* Descripción breve */}
                  <div className="flex items-start gap-2 p-3">
                    <Clock3 className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium text-[hsl(225,15%,15%)]">
                        Registro automático
                      </p>
                      <p className="text-sm text-gray-600">
                        El sistema registra tu tiempo de trabajo sin
                        intervención manual.
                      </p>
                    </div>
                  </div>

                  {/* Reglas (alineado con tu engine) */}
                  <div className="grid gap-2 p-3">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Activity className="h-4 w-4 mt-0.5 text-gray-500" />
                      <span>
                        Inicia al detectar actividad en la app
                        (teclado/click/acción relevante).
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <PauseCircle className="h-4 w-4 mt-0.5 text-gray-500" />
                      <span>
                        Pausa por inactividad &gt; 90 s y se reanuda al volver.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Info className="h-4 w-4 mt-0.5 text-gray-500" />
                      <span>
                        Cambia de contexto al abrir otro cliente y continúa el
                        tracking allí.
                      </span>
                    </div>
                  </div>

                  {/* Métricas breves (si ya las tenés en store, bindéalas) */}
                  {/* <div className="grid grid-cols-2 gap-4 p-3">
                    <div>
                      <p className="text-xs text-gray-500">Hoy trackeado</p>
                      <p className="font-medium text-slate-800">02:14 h</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Esta semana</p>
                      <p className="font-medium text-slate-800">12:30 h</p>
                    </div>
                  </div> */}
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </Card>
      <ChangePasswordDialog
        pwdOpen={pwdOpen}
        setPwdOpen={setPwdOpen}
        /* pwdStep={pwdStep}
        setPwdStep={setPwdStep} */
      />
    </div>
  );
};

export default Settings;
