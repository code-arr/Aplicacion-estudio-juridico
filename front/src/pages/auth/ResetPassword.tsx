// src/pages/auth/ResetPassword.tsx
import { resetPassword } from "@/api/user";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (typeof token !== "string" || !token) return;
    if (!password || !confirmPassword) return;

    // si hay errores, NO envíes
    if (passwordError || confirmPasswordError) return;

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (error) {
      console.log(error);
    }
  };
  /* const isValidPassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    return regex.test(password);
  }; */

  const handleChangePassword = (password: string) => {
    setPassword(password);
    const isValid =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);

    setPasswordError(!isValid); // si es válida, error = false
  };

  const handleChangeConfirmPassword = (confirmPassword: string) => {
    setConfirmPassword(confirmPassword);
    if (confirmPassword !== password) setConfirmPasswordError(true);
    else setConfirmPasswordError(false);
  };

  if (success) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-slate-100 to-sky-50 flex items-center justify-center">
        <div className="w-full max-w-md px-4 sm:px-0 transition-all duration-500 ease-in-out">
          <Card className="shadow-xl border-0 text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="flex flex-col items-center space-y-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-slate-800">
                  ¡Contraseña actualizada!
                </CardTitle>
                <CardDescription className="text-base">
                  Tu clave se cambió correctamente. Ya podés ingresar al sistema
                  con tu nueva contraseña.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-11 text-base font-medium bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 transition-all duration-200"
                onClick={() => navigate("/")}
              >
                Volver a Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <CardContent>
            <CardHeader className="px-2">
              <CardTitle className="text-2xl font-semibold">
                Restablecer contraseña
              </CardTitle>
              <CardDescription>
                Por favor ingresa tu nueva contraseña y confirma para continuar.
              </CardDescription>
              <Callout type="warning">
                Nunca utilice una contraseña utilizada anteriormente o una
                contraseña que utiliza en otro servicio.
              </Callout>
              {/* Chequear bien luego */}
            </CardHeader>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              <div className="flex flex-col space-y-3">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handleChangePassword(e.target.value)}
                  required
                  className={`w-full h-11 px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 ${
                    passwordError
                      ? "focus:ring-red-500 focus-visible:ring-red-500"
                      : "focus:ring-blue-500"
                  } `}
                />
                {passwordError && (
                  <p className="text-sm text-red-500 font-medium text-center">
                    La contraseña debe tener 8 digitos y contener al menos una
                    letra, un numero, un caracter especial y una mayuscula.
                  </p>
                )}
              </div>
              <div className="flex flex-col space-y-3">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => handleChangeConfirmPassword(e.target.value)}
                  required
                  className={`w-full h-11 px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 ${
                    confirmPasswordError
                      ? "focus:ring-red-500 focus-visible:ring-red-500"
                      : "focus:ring-blue-500"
                  } `}
                />
                {confirmPasswordError && (
                  <p className="text-sm text-red-500 font-medium text-center">
                    Ambas contraseñas deben ser iguales.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 mb-2 rounded-md font-medium text-white bg-gradient-to-br from-blue-600 to-blue-800 hover:opacity-90 transition-opacity duration-200 "
                disabled={
                  !password ||
                  !confirmPassword ||
                  passwordError ||
                  confirmPasswordError
                }
              >
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
