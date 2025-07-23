import React, { useEffect, useState } from "react";
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
import { Scale } from "lucide-react";
import type { LoginError } from "@/types/LoginError";

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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error.status) setError({ status: false, message: "" });
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error.status) setError({ status: false, message: "" });
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-slate-100 to-sky-50 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="law-gradient p-3 rounded-full bg-gradient-to-br from-blue-600 to-blue-700">
              <Scale className="h-8 w-8  text-white" />
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

              {/* {error && (
                <p className="text-red-500  text-sm text-center mt-2">
                  {error}
                </p>
              )} */}

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
                className="text-[#576175] underline text-sm hover:text-blue-700 transition-colors"
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
  );
};

export default LoginForm;
