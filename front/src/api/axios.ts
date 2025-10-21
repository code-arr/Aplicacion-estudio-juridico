// src/api/axios.ts
import axios, { AxiosError, AxiosHeaders } from "axios";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useAuthStore } from "@/store/useAuthStore";

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

// -------- Request interceptor: Bearer + lawyerId
api.interceptors.request.use(async (config) => {
  // 1) Token desde el store o, si no hay, desde el proceso main (Electron)
  let token = useAuthStore.getState().token;
  if (!token) {
    try {
      const authData = await window.electronAPI?.invoke("auth:get");
      token = authData?.token ?? null;
    } catch {
      token = null;
    }
  }

  // ⚠️ Usar AxiosHeaders
  const headers = (config.headers ?? new AxiosHeaders()) as AxiosHeaders;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers = headers;

  // 2) lawyerId actual como query param
  const lawyerId = useLawyerStore.getState().lawyer?.id;
  if (lawyerId) {
    // aseguramos objeto plano para params
    config.params = { ...(config.params as any), lawyerId };
  }

  return config;
});

// -------- Response interceptor: normaliza y desloguea ante 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      try {
        await useAuthStore.getState().reset();
      } catch {
        // noop
      }
    }

    const normalized = normalizeAxiosError(err);
    return Promise.reject(normalized);
  }
);

export default api;
