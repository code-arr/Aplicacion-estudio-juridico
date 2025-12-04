// src/routes/RootRouter.tsx
import { HashRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AppRoutes from "./AppRoutes";
import { Theme } from "@radix-ui/themes";
import { restoreSession, useAuthStore } from "@/store/useAuthStore";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { useEffect } from "react";
import UpdateListener from "@/components/UpdateListener";
import { useMainLogs } from "@/hooks/useMainLogs";

const RootRouter = () => {
  useMainLogs();
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
        <UpdateListener />
      </Theme>
    </HashRouter>
  );
};

export default RootRouter;
