// src/store/useAuthStore.ts
import { create } from "zustand";
import type { User } from "@/types/User";
import type { AuthState } from "@/types/AuthState";
import { getUserFromToken } from "@/api/user";

export async function restoreSession() {
  useAuthStore.setState({ isLoadingSession: true });
  try {
    const authData = await window.electronAPI.invoke("auth:get");
    if (authData && authData.token) {
      const user = await getUserFromToken(authData.token);
      if (user) {
        useAuthStore.getState().login(user, authData.token);
      }
    }
  } catch (error) {
    console.error("Error al restaurar sesión:", error);
  } finally {
    useAuthStore.setState({ isLoadingSession: false });
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  isLoadingSession: true, //Ver si conviene setearlo en true aca o antes de llamar a restoreSession en LoginPage
  isAdmin: false,
  isLawyer: false,
  showInactivityModal: false,
  login: async (user: User, token: string) => {
    await window.electronAPI.invoke("auth:save", {
      token,
      id: user.id,
      role: user.role,
    });
    set(() => ({
      user,
      token,
      isLoggedIn: true,
      isLoadingSession: false,
      isAdmin: user.role === "admin",
      isLawyer: user.role === "lawyer",
    }));
  },
  logout: async () => {
    await window.electronAPI.invoke("auth:clear");
    set(() => ({
      user: null,
      token: null,
      isLoadingSession: false,
      isLoggedIn: false,
      isAdmin: false,
      isLawyer: false,
    }));
  },
  setShowInactivityModal: (show) => set({ showInactivityModal: show }),
  reset: async () => await window.electronAPI.invoke("auth:clear"),
}));
