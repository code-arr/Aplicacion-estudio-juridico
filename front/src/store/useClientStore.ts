import type { Client } from "@/types/Client";
import { create } from "zustand";

interface ClientState {
  client: Client | null;
  setClient: (client: Client) => void;
  resetClient: () => void;
}

export const useClientStore = create<ClientState>()((set) => ({
  client: null,
  setClient: (client) => set({ client }),
  resetClient: () => set({ client: null }),
}));
