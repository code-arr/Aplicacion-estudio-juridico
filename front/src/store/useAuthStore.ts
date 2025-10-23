// src/store/useAuthStore.ts
import { create } from "zustand";
import type { User } from "@/types/User";
import type { AuthState } from "@/types/AuthState";
import { getMe, getUserById } from "@/api/user";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useTimerUIStore } from "@/store/useTimerUIStore";

export async function restoreSession() {
  console.log("Entra a restoreSession");
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
    // 1) Cerrar contexto + global con fin alineado y persistir snapshot
    await window.timer?.alignedStop?.("logout");

    // 2) Apagar el engine pero CONSERVAR el acumulado del día
    /* await window.timer?.disable?.({ preserveDay: true }); */

    // 3) Limpiar auth del main
    await window.electronAPI?.invoke("auth:clear");

    // 4) Reset visual del mirror en el renderer (opcional pero prolijo)
    //    Evita que el badge muestre restos hasta que se rehaga el bind en Dashboard
    useTimerUIStore.setState({
      enabled: false,
      status: "stopped",
      runningSince: null,
      accumSecToday: 0, // 👈 esto es SOLO estado UI; el acumulado real está en disco
      active: null,
      contextStatus: "stopped",
      lastActivityAt: Date.now(),
    });

    // 5) Estado de auth en memoria
    set(() => ({
      user: null,
      token: null,
      isLoadingSession: false,
      isLoggedIn: false,
      isAdmin: false,
      isLawyer: false,
    }));
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
