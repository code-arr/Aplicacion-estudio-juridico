import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const INACTIVITY_LIMIT = 60 * 60 * 1000;
const WARNING_DURATION = 60 * 1000;

export const useInactivityLogout = () => {
  const { reset, setShowInactivityModal } = useAuthStore();

  const warningTimeout = useRef<number | null>(null);
  const logoutTimeout = useRef<number | null>(null);

  // 👂 Escuchar actividad del usuario
  useEffect(() => {
    const resetTimers = () => {
      if (warningTimeout.current) {
        clearTimeout(warningTimeout.current);
      }
      if (logoutTimeout.current) {
        clearTimeout(logoutTimeout.current);
      }
    };

    // Modal fuera si estaba activo
    setShowInactivityModal(false);

    warningTimeout.current = window.setTimeout(() => {
      setShowInactivityModal(true); //Mostrar advertencia
    }, INACTIVITY_LIMIT - WARNING_DURATION);

    logoutTimeout.current = window.setTimeout(() => {
      reset(); // Logout automático
    }, INACTIVITY_LIMIT);

    // Eventos que detectan actividad
    const activityEvents = ["mousemove", "keydown", "click", "scroll"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimers)
    );

    resetTimers();

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimers)
      );
      if (warningTimeout.current) {
        clearTimeout(warningTimeout.current);
      }
      if (logoutTimeout.current) {
        clearTimeout(logoutTimeout.current);
      }
    };
  }, [reset, setShowInactivityModal]);
};
