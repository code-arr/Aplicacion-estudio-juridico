// src/api/axios.ts
import axios, { AxiosError } from "axios";
import { useLawyerStore } from "@/store/useLawyerStore";
// Si manejás auth en el store:
/* import { useAuthStore } from "@/store/useAuthStore"; */

export type NormalizedApiError = {
  kind: "AUTH" | "CLIENT" | "SERVER" | "NETWORK" | "UNKNOWN";
  status?: number;
  message: string; // para UI
  debug?: string; // info extra en dev
};

// Centralizado para reutilizar/typar
export function normalizeAxiosError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const backendMessage =
      (error.response?.data as any)?.message ||
      (typeof error.response?.data === "string"
        ? error.response?.data
        : undefined);

    if (!error.response) {
      // Red/CORS/timeout/502 del proxy sin body
      return {
        kind: "NETWORK",
        message:
          "No pudimos contactar al servidor. Verificá tu conexión o intentá más tarde.",
        debug: (error as AxiosError).message,
      };
    }

    if (status && status >= 500) {
      return {
        kind: "SERVER",
        status,
        message:
          "El servidor tuvo un problema. Intentá de nuevo en unos minutos.",
        debug: backendMessage || (error as AxiosError).message,
      };
    }

    if (status === 401 || status === 400) {
      return {
        kind: "AUTH",
        status,
        message: "Las credenciales ingresadas son incorrectas.",
        debug: backendMessage || (error as AxiosError).message,
      };
    }

    return {
      kind: "CLIENT",
      status,
      message: backendMessage || "Ocurrió un error con tu solicitud.",
      debug: (error as AxiosError).message,
    };
  }

  return {
    kind: "UNKNOWN",
    message: "Ocurrió un error inesperado.",
    debug: String(error),
  };
}

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://estudio-backend-dev.us-east-1.elasticbeanstalk.com",
  timeout: 10000,
});

// Asegura que el lawyerId siempre sea el ACTUAL del store
api.interceptors.request.use((config) => {
  const lawyerId = useLawyerStore.getState().lawyer?.id;
  if (lawyerId) {
    config.params = { ...(config.params || {}), lawyerId };
  }
  return config;
});

/* // ----- Interceptor de request
api.interceptors.request.use((config) => {
  // (opcional) token
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  // lawyerId actual
  const lawyerId = useLawyerStore.getState().lawyer?.id;
  if (lawyerId) {
    config.params = { ...(config.params || {}), lawyerId };
  }

  return config;
}); */

// ----- Interceptor de respuesta (normaliza errores SIEMPRE)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const normalized = normalizeAxiosError(err);

    // (opcional) si el back devuelve 401 para sesión expirada:
    // if (normalized.status === 401 && normalized.kind !== "AUTH") {
    //   useAuthStore.getState().reset();
    // }

    return Promise.reject(normalized);
  }
);

export default api;
