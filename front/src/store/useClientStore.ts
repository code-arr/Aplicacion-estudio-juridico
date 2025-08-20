import type { Client } from "@/types/Client";
import { getClientsData } from "@/api/client";
import { create } from "zustand";

const ttlMs = 86400000;

interface ClientState {
  clients: Client[] | null;
  clientDetail: Client | null;

  filters: { query: string; status?: string };
  setFilters: (p: Partial<ClientState["filters"]>) => void;

  isLoading: boolean;
  isHydrated: boolean;
  isRefreshing: boolean;
  inFlight: boolean;

  error: string | null;

  lastFetched: number;

  setClients: (clients: Client[]) => void;
  setClientDetail: (clientId: string) => void;
  resetClientDetail: () => void;

  hydrate: (opts?: { force?: boolean }) => Promise<void>;
}

export const useClientStore = create<ClientState>()((set, get) => ({
  clients: null,
  clientDetail: null,
  filters: { query: "", status: undefined },
  isLoading: false,
  isHydrated: false,
  isRefreshing: false,
  inFlight: false,
  error: null,
  lastFetched: 0,

  setClients: (clients: Client[]) => {
    set({
      clients,
      isLoading: false,
      isHydrated: true,
      isRefreshing: false,
      inFlight: false,
      error: null,
      lastFetched: Date.now(),
    });
  },
  setClientDetail: (clientId: string) => {
    const clientDetail = get().clients?.find(
      (client) => client.id === clientId
    );
    set({ clientDetail });
  },
  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),

  resetClientDetail: () => set({ clientDetail: null }),

  hydrate: async (opts?: { force?: boolean }) => {
    if (get().inFlight) return;
    const isFresh =
      get().lastFetched > 0 && Date.now() - get().lastFetched < ttlMs;
    if (!opts?.force && isFresh) return;

    if (get().isHydrated)
      set({ isRefreshing: true, inFlight: true, error: null });
    else set({ isLoading: true, inFlight: true, error: null });

    try {
      const data = await getClientsData();
      get().setClients(data);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible cargar los datos: Clientes";

      set({
        inFlight: false,
        isLoading: false,
        isRefreshing: false,
        error: message,
      });
    } finally {
      set({ inFlight: false, isLoading: false, isRefreshing: false });
    }
  },
}));

export const selectClients = (s: ClientState) => s.clients ?? [];
export const selectClientDetail = (s: ClientState) => s.clientDetail;

export const selectClientName = (clientId: string) => (s: ClientState) => {
  const client = s.clients?.find((client) => client.id === clientId);

  if (client?.type === "Fisica")
    return `${client.firstName}  ${client.lastName}`;
  else return client?.companyName;
};

export const selectFilteredClients = (s: ClientState) => {
  const base = s.clients ?? [];
  const { query, status } = s.filters;
  const q = query.trim().toLowerCase();
  return base
    .filter((client: Client) => !status || client.status === status)
    .filter(
      (client: Client) => !q || client.firstName?.toLowerCase().includes(q)
    );
};

export const selectIsLoadingClients = (s: ClientState) => s.isLoading;
export const selectIsClientsHydrated = (s: ClientState) => s.isHydrated;
export const selectIsRefreshing = (s: ClientState) => s.isRefreshing;

export const selectClientsError = (s: ClientState) => s.error;
export const selectClientsLastFetched = (s: ClientState) => s.lastFetched;

export const selectClientsBusy = (s: ClientState) =>
  s.isLoading || s.isRefreshing || s.inFlight;
