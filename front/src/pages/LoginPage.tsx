import { useEffect, useState } from "react";
import LoginForm from "@/components/LoginForm";
import DashboardRouter from "@/routes/DashboardRouter";
import { restoreSession, useAuthStore } from "@/store/useAuthStore";
import { loginUser } from "@/api/user";
import { Spinner } from "@radix-ui/themes";
import type { LoginError } from "@/types/LoginError";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoggedIn, login, isLoadingSession } = useAuthStore();
  const [error, setError] = useState<LoginError>({
    status: false,
    message: "",
  });

  useEffect(() => {
    restoreSession();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { user, token } = await loginUser(email, password);
      login(user, token);
    } catch (error) {
      console.log(error);
      setError({
        status: true,
        message: "Las credenciales ingresadas son incorrectas",
      });
      setPassword("");
    }
  };

  if (isLoadingSession) {
    return <Spinner size={"3"} />; //Despues puedo cambiarlo por algo mas pro
  }

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

  return <DashboardRouter />;
};

export default LoginPage;
