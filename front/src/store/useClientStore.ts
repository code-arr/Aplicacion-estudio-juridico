import type { Client } from "@/types/Client";
import { create } from "zustand";

interface ClientState {
  clients: Client[] | null;
  clientDetail: Client | null;
  setClients: (clients: Client[]) => void;
  setClientDetail: (client: Client) => void;
  resetClientDetail: () => void;
}

export const useClientStore = create<ClientState>()((set) => ({
  clients: null,
  clientDetail: null,
  setClients: (clients: Client[]) => set({ clients }),
  setClientDetail: (clientDetail) => set({ clientDetail }),
  resetClientDetail: () => set({ clientDetail: null }),
}));
