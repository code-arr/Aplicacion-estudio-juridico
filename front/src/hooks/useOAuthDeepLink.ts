// src/hooks/useOAuthDeepLink.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useOAuthDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (
      _: any,
      data: { status?: string; returnTo?: string } | undefined
    ) => {
      if (!data) return;
      const { status, returnTo } = data;
      // si venís con returnTo tipo "/%23/dashboard/settings" o "/#/dashboard/settings"
      try {
        const decoded = decodeURIComponent(returnTo || "/#/dashboard/settings");
        const isInternal = decoded.startsWith("/") || decoded.startsWith("/#");
        if (!isInternal) {
          console.warn("Deep link returnTo no es ruta interna, usar fallback");
          navigate("/dashboard");
          return;
        }
        const path = decoded.startsWith("/#") ? decoded.slice(2) : decoded;
        navigate(path || "/dashboard");
      } catch (e) {
        console.warn("oauth-deeplink parse error", e);
        navigate("/dashboard");
      }
    };

    // usar la API expuesta en preload: electronAPI.on
    window.electronAPI?.on("oauth-deeplink", handler);

    // No hay off expuesto por tu preload.on, así que no hacemos cleanup complejo.
    // Si querés evitar duplicados en hot reload podrías guardar un flag global.
    // Aquí lo dejamos simple:
    return () => {
      // opcional: si preload ofreciera off, la llamarías aquí
      // window.electronAPI?.off?.("oauth-deeplink", handler);
    };
  }, [navigate]);
}
