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
      // ✅ ahora validamos el token contra el back
      const user = await getMe();
      /* const user = await getUserById(authData.id); */

      // 1) Primero login (para que el interceptor ya tenga token del store)
      await useAuthStore.getState().login(user, authData.token);

      // ✅ SOLO si es lawyer, hidrato el store del abogado
      if (user.role === "lawyer") {
        // Si tenés lawyerId, mejor hidratar por id:
        // await useLawyerStore.getState().hydrateById(user.lawyerId!);
        useLawyerStore.getState().setLawyer(user.email);
      }
      // Dejo que login unifique flags y estado
      /*   await useAuthStore.getState().login(user, authData.token); */
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
