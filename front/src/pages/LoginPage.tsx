import { useEffect } from "react";
import LoginForm from "@/components/LoginForm";
import DashboardRouter from "@/routes/DashboardRouter";
import { restoreSession, useAuthStore } from "@/store/useAuthStore";
import { loginUser } from "@/api/user";
import { Spinner } from "@radix-ui/themes";

const LoginPage = () => {
  const { isLoggedIn, login, isLoadingSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { user, token } = await loginUser(email, password);
      login(user, token);
    } catch (error) {
      console.log(error);
    }
  };

  if (isLoadingSession) {
    return <Spinner size={"3"} />; //Despues puedo cambiarlo por algo mas pro
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <DashboardRouter />;
};

export default LoginPage;
