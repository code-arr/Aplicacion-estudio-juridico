// src/hooks/useOAuthDeepLink.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
// 1️⃣ Importamos TU hook
import { useToast } from "@/hooks/useToast";

export const useOAuthDeepLink = () => {
  const navigate = useNavigate();
  const refreshSession = useAuthStore((s) => s.refreshSession);

  // 2️⃣ Inicializamos el hook acá
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuth = (
      _event: any,
      data: { status?: string; returnTo?: string }
    ) => {
      console.log("🪝 Deep link recibido en React:", data);

      if (data.status === "success") {
        // 3️⃣ Usamos tu sintaxis: objeto con variant y title
        toast({
          variant: "success",
          title: "¡Conectado!",
          description: "Cuenta de Google vinculada correctamente.",
        });

        // Actualizar store
        refreshSession();

        // Navegar
        if (data.returnTo) {
          navigate(data.returnTo.replace("/#", ""));
        }
      } else {
        // Error
        toast({
          variant: "destructive",
          title: "Error",
          description: "Hubo un problema al conectar Google.",
        });
      }
    };

    window.electronAPI?.on("oauth-deeplink", handleOAuth);

    return () => {
      // Cleanup si tuvieras removeListener
    };
    // 4️⃣ Agregamos 'toast' a las dependencias del useEffect
  }, [refreshSession, navigate, toast]);
};
