// src/routes/RootRouter.tsx
import { HashRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AppRoutes from "./AppRoutes";
import { Theme } from "@radix-ui/themes";
import { restoreSession, useAuthStore } from "@/store/useAuthStore";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { useEffect } from "react";

const RootRouter = () => {
  const { isLoadingSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoadingSession) return <LoadingScreen />;

  return (
    <HashRouter>
      <Theme>
        <AppRoutes />
        <Toaster />
      </Theme>
    </HashRouter>
  );
};

export default RootRouter;
