import store from "./electronStorage.js";
import type { auth } from "../../shared/types/AuthData.js";

export const saveAuthData = (auth: auth) => {
  store.set("auth", auth);
};

export const getAuthData = (): auth | null => {
  const data = store.get("auth");

  if (
    typeof data === "object" &&
    data !== null &&
    "token" in data &&
    "id" in data &&
    "role" in data &&
    typeof data.token === "string" &&
    typeof data.id === "string" &&
    (data.role === "admin" || data.role === "lawyer")
  ) {
    return data as auth;
  }

  return null;
};

export const clearAuthData = () => {
  store.delete("auth");
};
