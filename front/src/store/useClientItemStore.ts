import { create } from "zustand";
import type { ClientItem } from "@/types/ClientItem";
import {
  getClientItemsByClientId,
  getClientItemsData,
  getRecentClientItemsData,
} from "@/api/clientItem";

const EMPTY_CLIENT_ITEMS = Object.freeze([]);
const ttlMs = 900000;

interface ClientItemState {
  clientItems: ClientItem[] | null;
  clientItemDetail: ClientItem | null;
  clientItemsByClientId: ClientItem[] | null;

  filters: { query: string; status?: string };
  setFilters: (p: Partial<ClientItemState["filters"]>) => void;

  isLoading: boolean;
  isHydrated: boolean;
  isRefreshing: boolean;
  inFlightFetch: boolean;
  inFlightPrefetch: boolean;

  isPrefetching: boolean;
  isPrefetched: boolean;

  error: string | null;

  lastFetched: number;

  setClientItems: (clientItems: ClientItem[]) => void;
  setClientItemDetail: (clientItem: ClientItem) => void;
  resetClientItemDetail: () => void;
  setClientItemsByClientId: (clientItems: ClientItem[]) => void;

  fetchClientItems: () => Promise<void>;
  prefetchRecentClientItems: (opts?: { limit?: number }) => Promise<void>;
  fetchClientItemsByClientId: (clientId: string) => Promise<void>;

  hydrate: (opts?: { force?: boolean }) => Promise<void>;
  reset: () => void;
}

export const useClientItemStore = create<ClientItemState>((set, get) => ({
  clientItems: null,
  clientItemDetail: null,
  clientItemsByClientId: null,
  filters: { query: "", status: undefined },
  isLoading: false,
  isHydrated: false,
  isRefreshing: false,
  inFlightFetch: false,
  inFlightPrefetch: false,
  isPrefetching: false,
  isPrefetched: false,
  error: null,
  lastFetched: 0,

  setClientItems: (clientItems: ClientItem[]) =>
    set({
      clientItems: clientItems,
      isLoading: false,
      isRefreshing: false,
      inFlightFetch: false,
      inFlightPrefetch: false,
      isPrefetched: true,
      isHydrated: true,
      error: null,
      lastFetched: Date.now(),
    }),

  setClientItemDetail: (clientItem: ClientItem) =>
    set({ clientItemDetail: clientItem }),

  resetClientItemDetail: () => set({ clientItemDetail: null }),

  setClientItemsByClientId: (items) =>
    set({ clientItemsByClientId: items, error: null }),

  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),

  fetchClientItems: async () => {
    const data = await getClientItemsData();
    get().setClientItems(data);
  },

  prefetchRecentClientItems: async (opts) => {
    const data = await getRecentClientItemsData(opts?.limit ?? 50);
    get().setClientItems(data);
  },

  fetchClientItemsByClientId: async (clientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getClientItemsByClientId(clientId);
      if (!data.length)
        throw Error("ClientItems no tiene datos para ese cliente");

      get().setClientItemsByClientId(data);
    } catch (error) {
      console.error(error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "No fue posible cargar los datos: ClientItems",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  hydrate: async (opts?: { force?: boolean }) => {
    if (!get().isPrefetched) {
      if (get().inFlightPrefetch) return;
      set({
        isPrefetching: true,
        inFlightPrefetch: true,
        error: null,
      });
      try {
        await get().fetchClientItems();
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar los datos: ClientItems";
        set((s) => ({
          isPrefetched: false,
          isHydrated: s.isHydrated,
          error: message,
        }));
      } finally {
        set({ inFlightPrefetch: false, isPrefetching: false });
      }
    } else {
      if (get().inFlightFetch) return;
      const isFresh =
        get().lastFetched > 0 && Date.now() - get().lastFetched < ttlMs;
      if (!opts?.force && isFresh) {
        if (get().error) set({ error: null });
        return;
      }

      if (get().isHydrated)
        set({ isRefreshing: true, inFlightFetch: true, error: null });
      else set({ isLoading: true, inFlightFetch: true, error: null });

      try {
        await get().fetchClientItems();
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar los datos: ClientItems";

        set((s) => ({
          isHydrated: s.isHydrated,
          error: message,
        }));
      } finally {
        set({ inFlightFetch: false, isLoading: false, isRefreshing: false });
      }
    }
  },

  reset: () =>
    set({
      clientItems: null,
      clientItemDetail: null,
      clientItemsByClientId: null,
      isLoading: false,
      isHydrated: false,
      isRefreshing: false,
      inFlightFetch: false,
      isPrefetching: false,
      isPrefetched: false,
      error: null,
      lastFetched: 0,
    }),
}));

export const selectClientItems = (s: ClientItemState) =>
  s.clientItems ?? EMPTY_CLIENT_ITEMS;
export const selectClientItemDetail = (s: ClientItemState) =>
  s.clientItemDetail;
export const selectClientItemsByClientId = (s: ClientItemState) =>
  s.clientItemsByClientId ?? EMPTY_CLIENT_ITEMS;

export const selectClientItemsByFilters = (s: ClientItemState) => {
  const base = s.clientItems ?? [];
  const { query, status } = s.filters;
  const q = query.trim().toLowerCase();
  return base
    .filter((item: ClientItem) => !status || item.status === status)
    .filter((item: ClientItem) => !q || item.title.toLowerCase().includes(q));
};
export const selectClientItemsByFiltersAndClient = (s: ClientItemState) => {
  const base = s.clientItemsByClientId ?? [];
  const { query, status } = s.filters;
  const q = query.trim().toLowerCase();
  return base
    .filter((item: ClientItem) => !status || item.status === status)
    .filter((item: ClientItem) => !q || item.title.toLowerCase().includes(q));
};
export const selectClientItemsByClientAndType =
  (s: ClientItemState) => (typeId: string) => {
    const base = s.clientItemsByClientId ?? [];
    return base.filter((item: ClientItem) => item.itemTypeId === typeId);
  };

export const selectIsClientItemsLoading = (s: ClientItemState) => s.isLoading;
export const selectIsClientItemsHydrated = (s: ClientItemState) => s.isHydrated;
export const selectIsClientItemsRefreshing = (s: ClientItemState) =>
  s.isRefreshing;
export const selectIsClientItemsPrefetching = (s: ClientItemState) =>
  s.isPrefetching;
export const selectIsClientItemsPrefetched = (s: ClientItemState) =>
  s.isPrefetched;

export const selectClientItemsError = (s: ClientItemState) => s.error;
export const selectClientItemsLastFetched = (s: ClientItemState) =>
  s.lastFetched;

export const selectClientItemsBusy = (s: ClientItemState) =>
  s.isLoading || s.isRefreshing || s.inFlightFetch || s.inFlightPrefetch;
