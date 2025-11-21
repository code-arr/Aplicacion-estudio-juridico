// src/pages/auth/LoginPage.tsx
import { useEffect, useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { useAuthStore } from "@/store/useAuthStore";
import { loginUser } from "@/api/user";
import type { LoginError } from "@/types/LoginError";
import { useNavigate } from "react-router-dom";
import { useLawyerStore } from "@/store/useLawyerStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sacamos isLoadingSession porque AppRoutes ya lo maneja
  const { isLoggedIn, login, user, isAdmin, isLawyer } = useAuthStore();
  const setLawyer = useLawyerStore((s) => s.setLawyer);

  const [error, setError] = useState<LoginError>({
    status: false,
    message: "",
  });

  // Redirección si ya está logueado (por si entra manual a la URL)
  useEffect(() => {
    if (isLoggedIn && user) {
      if (isAdmin) {
        navigate("/dashboard/admin/clients", { replace: true });
      } else if (isLawyer) {
        navigate("/dashboard/clients", { replace: true });
      }
    }
  }, [isLoggedIn, user, isAdmin, isLawyer, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { user, token } = await loginUser(email, password);

      // Importante: Setear el lawyer store antes del login global
      // para evitar parpadeos en componentes que dependen de lawyer
      setLawyer(user.email);

      await login(user, token);

      // Navegación explícita post-login
      if (user.role === "admin") {
        navigate("/dashboard/admin/clients", { replace: true });
      } else {
        navigate("/dashboard/clients", { replace: true });
      }
    } catch (error) {
      setError({
        status: true,
        message: "Las credenciales ingresadas son incorrectas", // O el mensaje que venga del back
      });
      setPassword("");
    }
  };

  // Si está logueado, retornamos null para evitar flash de contenido mientras el useEffect redirige
  if (isLoggedIn) return null;

  return (
    <LoginForm
      onLogin={handleLogin}
      error={error}
      setError={setError}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
    />
  );
};

export default LoginPage;
