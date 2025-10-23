// src/api/user.ts
import type { User } from "@/types/User";
import axios from "./axios";
import type { LoginEntry } from "@/types/LoginEntry";

type LoginResponse = {
  user: User;
  token: string;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const deviceId = (await window.device?.getId?.()) ?? "unknown"; // ⬅️ ahora es async
    const response = await axios.post("/auth/login", {
      email,
      password,
      deviceId, // ⬅️ NUEVO
    });
    return response.data;
  } catch (error) {
    console.log("No se pudo iniciar sesión:", error);
    throw error;
  }
};

// 🔁 Nuevo: obtener el usuario desde el token (Bearer) -> /auth/me
export async function getMe(): Promise<User> {
  const { data } = await axios.get("/auth/me");
  return data;
}

export async function getRecentLogins(token: string): Promise<LoginEntry[]> {
  const { data } = await axios.get("/me/logins");
  return Array.isArray(data) ? data : [];
}

/* export const getUserFromToken = async (token: string): Promise<User> => {
    try {
      const response = await axios.post("/auth/getUserFromToken", { token });
      return response.data;
    } catch (error) {
      console.log("No se pudo restaurar la sesión:", error);
      throw error;
    }
  }; */

export const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await axios.get(`/user/getUserById/${id}`);
    return response.data;
  } catch (error) {
    console.log("No se pudo restaurar la sesión:", error);
    throw error;
  }
};

export const verifyPassword = async (
  password: string,
  email: string
): Promise<boolean> => {
  try {
    return (await axios.post("/user/verifyPassword", { password, email })).data;
  } catch (error) {
    console.error("Error al verificar la contraseña:", error);
    throw error;
  }
};

export const changePassword = async (
  newPassword: string,
  email: string
): Promise<void> => {
  try {
    await axios.post("/user/newPassword", { newPassword, email });
  } catch (error) {
    console.error("Error al cambiar la contraseña", error);
    throw error;
  }
};

export async function requestPasswordReset(email: string) {
  await axios.post(`/auth/forgot-password`, { email });
}

export const resetPassword = async (
  token: string,
  password: string
): Promise<void> => {
  try {
    await axios.patch("/auth/resetPassword", { token, newPassword: password });
  } catch (error) {
    console.error("Error al cambiar la contraseña", error);
  }
};

export const googleConnect = async (
  token: string,
  email: string
): Promise<void> => {
  try {
    const { data } = await axios.get(`/auth/google/connect?email=${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data?.redirectUrl) {
      window.location.href = data.redirectUrl; // te manda a Google
    } else {
      console.error("No vino redirectUrl en la respuesta");
    }
  } catch (error) {
    console.error("Error al conectar con google", error);
  }
};
