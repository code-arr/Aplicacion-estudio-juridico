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
    /* const lawyer = await axios.post("lawyer/getLaweyer/:email", {email: user.email}) */
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
