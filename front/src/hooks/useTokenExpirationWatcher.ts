import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { isTokenExpired, getTokenTimeLeft } from "@/utils/token";

export const useTokenExpirationWatcher = () => {
  console.log("Entra en useTokenExpirationWatcher");

  const { token, reset } = useAuthStore();

  useEffect(() => {
    let timeoutId: number;

    if (!token || isTokenExpired(token)) {
      console.log("Resetea");
      reset();
      return;
    }

    const timeLeft = getTokenTimeLeft(token);

    if (timeLeft !== null) {
      timeoutId = window.setTimeout(() => reset(), timeLeft);
    } else {
      console.log("Resetea");
      reset(); // si no se puede calcular el tiempo restante
    }

    return () => clearTimeout(timeoutId);
  }, [token, reset]);
};
