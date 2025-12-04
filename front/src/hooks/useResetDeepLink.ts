// src/hooks/useResetDeepLink.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useResetDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    // Usamos el namespace que definiste en preload
    const api = window.authDeepLink;
    if (!api) return;

    const removeListener = api.onResetLink((token) => {
      console.log("🔗 Token de reset recibido, navegando...");
      // Navegación limpia con React Router
      navigate(`/reset?token=${encodeURIComponent(token)}`);
    });

    return () => {
      // Si tu preload devolvía una función de limpieza, la ejecutamos
      removeListener && removeListener();
    };
  }, [navigate]);
}
