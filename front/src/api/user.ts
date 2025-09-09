import type { User } from "@/types/User";
import axios from "./axios";

type LoginResponse = {
  user: User;
  token: string;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await axios.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.log("No se pudo iniciar sesión:", error);
    throw error;
  }
};

export const getUserFromToken = async (token: string): Promise<User> => {
  try {
    const response = await axios.post("/auth/getUserFromToken", { token });
    return response.data;
  } catch (error) {
    console.log("No se pudo restaurar la sesión:", error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await axios.get(`/user/getUserById/${id}`);
    return response.data;
  } catch (error) {
    console.log("No se pudo restaurar la sesión:", error);
    throw error;
  }
};

export const sendEmailForResetPassword = async (
  email: string
): Promise<void> => {
  try {
    await axios.post("/auth/sendResetPassword", { email });
  } catch (error) {
    console.error("Error al enviar el email:", error);
    throw error;
  }
};

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
