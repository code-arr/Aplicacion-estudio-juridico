// src/api/user.ts
import type { User } from "@/types/User";
import axios from "./axios";
import type { LoginEntry } from "@/types/LoginEntry";

export type RegisterPayload = {
  user: { email: string; password: string };
  lawyer: {
    firstName: string;
    lastName: string;
    address?: string;
    phone?: string;
    rut?: string;
    type?: string;
    seniorityLevel?: string;
  };
};

export async function createLawyerWithUser(payload: RegisterPayload) {
  const res = await axios.post("/auth/register", payload);
  if (!res.status) {
    throw new Error(`Error ${res.status}`);
  }
  return res.data; // asume backend devuelve lawyer + user u objeto útil
}

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

export async function deleteUser(userId: string) {
  const data = await axios.delete(`user/${userId}`);
  if (!data.data) throw new Error("Error al desactivar usuario");
  return data.data;
}

// 🔁 Nuevo: obtener el usuario desde el token (Bearer) -> /auth/me
export async function getMe(): Promise<User> {
  const { data } = await axios.get("/auth/me");
  console.log(data);

  return data;
}
export async function getAllUsers() {
  const { data } = await axios.get("/user/getAll");
  console.log(data);

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
  await axios.post(`/auth/forgotPassword`, { email });
}

export const resetPassword = async (
  token: string,
  password: string
): Promise<void> => {
  try {
    await axios.patch("/auth/resetPassword", { token, password });
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
      await window.api.openExternal(data.redirectUrl); // te manda a Google
    } else {
      console.error("No vino redirectUrl en la respuesta");
    }
  } catch (error) {
    console.error("Error al conectar con google", error);
  }
};
