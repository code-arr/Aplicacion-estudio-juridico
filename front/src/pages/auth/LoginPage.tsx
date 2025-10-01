import { useEffect, useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { useAuthStore } from "@/store/useAuthStore";
import { loginUser } from "@/api/user";
import type { LoginError } from "@/types/LoginError";
import { useLocation, useNavigate } from "react-router-dom";
import { useLawyerStore } from "@/store/useLawyerStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoggedIn, login, isLoadingSession, user, isAdmin, isLawyer } =
    useAuthStore();
  const setLawyer = useLawyerStore((s) => s.setLawyer);
  const [error, setError] = useState<LoginError>({
    status: false,
    message: "",
  });
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    if (isLoggedIn && user) {
      if (isLawyer) {
        navigate(from, { replace: true });
        /* navigate("/dashboard", { replace: true }); */
      } else if (isAdmin) {
        navigate("/adminDashboard", { replace: true });
      }
    }
  }, [isLoggedIn, user, navigate, isAdmin, isLawyer, from]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { user, token } = await loginUser(email, password);
      setLawyer(user.email);
      await login(user, token);
    } catch (error) {
      console.log(error);
      setError({
        status: true,
        message: "Las credenciales ingresadas son incorrectas",
      });
      setPassword("");
    }
  };
  //Creo que es redundante ya que en AppRoutes y DashboardRouter ya lo renderiza mientras verifica si se puede restaurar la sesion
  /* if (isLoadingSession) {
    return <Spinner size={"3"} />; //Despues puedo cambiarlo por algo mas pro
  } */

  if (!isLoggedIn) {
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
  }

  return null;
};

export default LoginPage;
