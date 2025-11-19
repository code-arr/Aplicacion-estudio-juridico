// src/routes/RootRouter.tsx
import { HashRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AppRoutes from "./AppRoutes";
import { Theme } from "@radix-ui/themes";
import { restoreSession, useAuthStore } from "@/store/useAuthStore";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { useEffect } from "react";
import { useResetDeepLink } from "@/hooks/useResetDeepLink";
import UpdateListener from "@/components/UpdateListener";
import { useOAuthDeepLink } from "@/hooks/useOAuthDeepLink"; // importalo aquí

// nuevo componente pequeño que ejecuta el hook DENTRO del Router
const OAuthDeepLinkListener = () => {
  useOAuthDeepLink();
  return null;
};

const RootRouter = () => {
  const { isLoadingSession } = useAuthStore();
  useResetDeepLink();

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoadingSession) return <LoadingScreen />;

  return (
    <HashRouter>
      <Theme>
        {/* <-- escuchar deep-links desde dentro del Router */}
        <OAuthDeepLinkListener />

        <AppRoutes />
        <Toaster />
        <UpdateListener />
      </Theme>
    </HashRouter>
  );
};

export default RootRouter;
