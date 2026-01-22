// src/store/useAuthStore.ts
import { create } from "zustand";
import type { User } from "@/types/User";
import type { AuthState } from "@/types/AuthState";
import { getMe } from "@/api/user";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useTimerUIStore } from "@/store/useTimerUIStore";
import { useClientStore } from "./useClientStore";
import { useClientItemStore } from "./useClientItemStore";

let restoreSessionOnce = false;

export async function restoreSession() {
  if (restoreSessionOnce) return;
  restoreSessionOnce = true;
  useAuthStore.setState({ isLoadingSession: true });
  try {
    const authData = await window.electronAPI?.invoke("auth:get");
    if (authData?.token) {
      const user = await getMe(); // valida token contra el back

      // 🚫 Si es admin, NO restaurar nunca
      if (user.role === "admin") {
        await window.electronAPI?.invoke("auth:clear"); // limpia persistencia
        useAuthStore.setState({
          user: null,
          token: null,
          isLoggedIn: false,
          isAdmin: false,
          isLawyer: false,
        });
        return; // salimos sin loguear
      }

      // ✅ Solo lawyer: continuar login y preparativos
      await useAuthStore.getState().login(user, authData.token);

      if (user.role === "lawyer") {
        useLawyerStore.getState().setLawyer(user.email);
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
  isLoadingSession: true,
  isAdmin: false,
  isLawyer: false,
  showInactivityModal: false,

  refreshSession: async () => {
    try {
      // 1. Volvemos a pedir el usuario al back (traerá el googleEmail nuevo)
      const updatedUser = await getMe();

      // 2. Actualizamos solo el usuario en el store, sin tocar el token ni flags
      set({ user: updatedUser });

      console.log("🔄 Sesión refrescada: Datos de usuario actualizados.");
    } catch (error) {
      console.error("Error al refrescar la sesión:", error);
      // No deslogueamos por error aquí para no ser invasivos, solo logueamos error
    }
  },

  // 🔐 login: deriva flags SIEMPRE desde user.role
  login: async (user: User, token: string) => {
    if (user.role !== "admin") {
      await window.electronAPI.invoke("auth:save", {
        token,
        id: user.id,
        role: user.role,
      });
    } else {
      // Por seguridad: admin nunca queda persistido
      await window.electronAPI?.invoke("auth:clear");
    }

    // Estado en memoria igual que siempre
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
    // 1️⃣ Avisar LOGOUT al sistema de timers (orquestador)
    await window.timer?.disable?.();

    // 2️⃣ Limpiar auth del main
    await window.electronAPI?.invoke("auth:clear");

    // 3️⃣ Reset visual del timer en el renderer (solo UI)
    useTimerUIStore.setState({
      enabled: false,
      ready: false,
      status: "stopped",
      runningSince: null,
      accumSecToday: 0, // ⚠️ SOLO UI, el real está persistido
      active: null,
      contextStatus: "stopped",
      lastActivityAt: Date.now(),
    });

    // 4️⃣ Estado de auth en memoria
    set(() => ({
      user: null,
      token: null,
      isLoadingSession: false,
      isLoggedIn: false,
      isAdmin: false,
      isLawyer: false,
    }));

    // 5️⃣ Limpiar stores relacionados
    useLawyerStore.getState().resetLawyer();
    useClientStore.getState().reset();
    useClientItemStore.getState().reset();
  },
  reset: async () => {
    await window.electronAPI?.invoke("auth:clear");
    set(() => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isLoadingSession: false,
      isAdmin: false,
      isLawyer: false,
      showInactivityModal: false,
    }));
  },
  setShowInactivityModal: (show) => set({ showInactivityModal: show }),
}));
