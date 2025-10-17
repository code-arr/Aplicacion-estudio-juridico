// src/components/auth/LoginForm.tsx
import React, { useState } from "react";
import type { LoginError } from "@/types/LoginError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardError,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import { requestPasswordReset } from "@/api/user";
import Logo from "@/assets/logos/logo-i&a-2.png";

type LoginFormProps = {
  onLogin: (email: string, password: string) => void;
  error: LoginError;
  setError: React.Dispatch<React.SetStateAction<LoginError>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
};

const LoginForm = ({
  onLogin,
  error,
  setError,
  email,
  setEmail,
  password,
  setPassword,
}: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [emailResetPassword, setEmailResetPassword] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return setError({
        status: true,
        message: "Por favor complete todos los campos.",
      });
    }

    setIsLoading(true);

    try {
      await onLogin(email, password); // asumimos que esta función puede demorar
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isEmail(emailResetPassword)) {
      setResetError("Ingresá un email válido.");
      return;
    }
    setResetError(null);
    setResetSending(true);
    try {
      await requestPasswordReset(emailResetPassword); // axios
      setResetDone(true); // mostramos éxito genérico (sin revelar si existe o no)
    } catch {
      setResetError("No pudimos procesar la solicitud. Intentá de nuevo.");
    } finally {
      setResetSending(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error.status) setError({ status: false, message: "" });
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error.status) setError({ status: false, message: "" });
    setPassword(e.target.value);
  };

  return (
    <div>
      <Dialog
        open={resetPasswordDialog}
        onOpenChange={(open) => {
          setResetPasswordDialog(open);
          if (!open) {
            setResetError(null);
            setResetDone(false);
            setResetSending(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            {!resetDone ? (
              <>
                <DialogDescription>
                  Ingresá el correo asociado a tu cuenta. Si coincide, te
                  enviaremos un enlace para restablecer tu contraseña.
                </DialogDescription>
              </>
            ) : (
              <DialogDescription>
                Si la dirección existe, te enviamos un enlace. Revisá tu correo
                (y la carpeta de spam).
              </DialogDescription>
            )}
          </DialogHeader>

          {!resetDone && (
            <div className="flex flex-col space-y-3">
              <Label htmlFor="emailResetPassword">Email</Label>
              <Input
                id="emailResetPassword"
                value={emailResetPassword}
                placeholder="ejemplo@estudio.com"
                onChange={(e) => {
                  setEmailResetPassword(e.target.value);
                  if (resetError) setResetError(null);
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    isEmail(emailResetPassword) &&
                    !resetSending
                  ) {
                    e.preventDefault();
                    handleResetPassword();
                  }
                }}
              />
              {resetError && (
                <p className="text-sm text-red-600">{resetError}</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {!resetDone ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetPasswordDialog(false)}
                  disabled={resetSending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={!isEmail(emailResetPassword) || resetSending}
                >
                  {resetSending ? "Enviando..." : "Continuar"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setResetPasswordDialog(false)}
              >
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-slate-100 to-sky-50 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="law-gradient p-3 rounded-full bg-gradient-to-br from-blue-600 to-blue-700">
                <img src={Logo} className="h-8 w-8  text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ibarra y Asociados
            </h1>
            <p className="text-gray-600 mt-2">Sistema de Gestión Legal</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-semibold">
                Iniciar Sesión
              </CardTitle>
              <CardDescription>
                Ingrese sus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            {error.status && (
              <CardError className="flex justify-self-center w-fit">
                {error.message}
              </CardError>
            )}
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
                <div className="flex flex-col space-y-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="abogado@estudio.com"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className="w-full h-11 px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col space-y-3">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full h-11 px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button
                  type="submit"
                  className={`w-full h-11 mb-2 rounded-md font-medium text-white bg-gradient-to-br from-blue-600 to-blue-800 transition-opacity duration-200 ${
                    isLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Ingresar"}
                </Button>

                <Button
                  type="button"
                  variant={"link"}
                  className="text-[#576175] underline text-sm hover:text-blue-700 transition-colors cursor-pointer"
                  onClick={() => {
                    setEmailResetPassword(email || ""); // ⬅️ prellenar
                    setResetError(null);
                    setResetDone(false);
                    setResetPasswordDialog(true);
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500">
            © 2024 Estudio Jurídico. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
