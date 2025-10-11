// src/store/useAdminStore.ts
import { create } from "zustand";
import type { Admin } from "@/types/Admin";
import { getAdminByUserId } from "@/api/admin";

type AdminState = {
  admin: Admin | null;
  isLoading: boolean;
  isHydrated: boolean;

  setAdmin: (a: Admin | null) => void;
  clear: () => void;

  hydrateByUserId: (userId: string) => Promise<void>;
};

export const useAdminStore = create<AdminState>()((set, get) => ({
  admin: null,
  isLoading: false,
  isHydrated: false,

  setAdmin: (a) => set({ admin: a, isHydrated: !!a }),
  clear: () => set({ admin: null, isHydrated: false }),

  hydrateByUserId: async (userId: string) => {
    // Evitamos pedir dos veces si ya está cargado
    if (get().isHydrated || get().isLoading) return;
    set({ isLoading: true });
    try {
      const a = await getAdminByUserId(userId);
      set({ admin: a, isHydrated: true });
    } catch (e) {
      console.error("[AdminStore] hydrate error:", e);
      set({ admin: null, isHydrated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
