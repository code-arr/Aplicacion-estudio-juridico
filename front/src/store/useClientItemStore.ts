// src/store/useClientItemStore.ts
import { create } from "zustand";
import type { ClientItem } from "@/types/ClientItem";
import {
  getClientItemsByClientId,
  getAllClientItems,
  getRecentClientItems,
  getClientItemsByLawyerId,
} from "@/api/clientItem";
import { sameIds, topNRecent } from "@/utils/clientItems";

const EMPTY_CLIENT_ITEMS: ClientItem[] = [];
const ttlMs = 900000;

interface ClientItemState {
  clientItems: ClientItem[] | null;
  recentClientItems: ClientItem[] | null;
  clientItemsByClientId: ClientItem[] | null;
  recentClientItemsByClientId: ClientItem[] | null;
  clientItemDetail: ClientItem | null;

  filters: { query: string; status?: string; order?: string };
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
  setClientItemsByClientId: (clientItems: ClientItem[]) => void;
  setClientItemDetail: (clientItemId: string) => void;

  resetClientItems: () => void;
  resetClientItemsByClientId: () => void;
  resetClientItemDetail: () => void;

  fetchAllClientItems: () => Promise<void>;
  fetchClientItemsByLawyerId: (lawyerId: string) => Promise<void>;
  prefetchRecentClientItems: (opts?: { limit?: number }) => Promise<void>;
  fetchClientItemsByClientId: (clientId: string) => Promise<void>;

  hydrate: (opts?: { force?: boolean }) => Promise<void>;
  hydrateByLawyer: (
    lawyerId: string,
    opts?: { force?: boolean }
  ) => Promise<void>;
  reset: () => void;
}

export const useClientItemStore = create<ClientItemState>((set, get) => ({
  clientItems: null,
  recentClientItems: null,
  clientItemsByClientId: null,
  recentClientItemsByClientId: null,
  clientItemDetail: null,
  filters: { query: "", status: undefined, order: undefined },
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

  setClientItemsByClientId: (items) =>
    set((s) => {
      const nextFull = items ?? [];
      const prevFull = s.clientItemsByClientId ?? [];
      const prevRecent = s.recentClientItemsByClientId ?? [];

      const nextRecent = topNRecent(nextFull, 4);

      // armamos un patch mínimo para no disparar renders al cohete
      const patch: Partial<ClientItemState> = { error: null };

      if (!sameIds(prevFull, nextFull)) {
        patch.clientItemsByClientId = nextFull;
      }
      if (!sameIds(prevRecent, nextRecent)) {
        patch.recentClientItemsByClientId = nextRecent;
      }
      return Object.keys(patch).length > 1 // (>1 porque siempre trae error:null)
        ? (patch as ClientItemState)
        : s;
    }),

  setClientItemDetail: (clientItemId: string) => {
    const clientItemDetail = get().clientItems?.find(
      (item) => item.id === clientItemId
    );
    set({ clientItemDetail });
  },
  resetClientItems: () => set({ clientItems: null }),

  resetClientItemsByClientId: () =>
    set({ clientItemsByClientId: null, recentClientItemsByClientId: null }),

  resetClientItemDetail: () => set({ clientItemDetail: null }),

  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),

  fetchAllClientItems: async () => {
    const data = await getAllClientItems();
    get().setClientItems(data);
  },

  fetchClientItemsByLawyerId: async (lawyerId: string) => {
    const data = await getClientItemsByLawyerId(lawyerId);
    get().setClientItems(data);
  },

  prefetchRecentClientItems: async (opts) => {
    const data = await getRecentClientItems(opts?.limit ?? 50);
    get().setClientItems(data);
  },

  fetchClientItemsByClientId: async (clientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getClientItemsByClientId(clientId);
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
        await get().fetchAllClientItems();
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
        await get().fetchAllClientItems();
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

  hydrateByLawyer: async (lawyerId: string, opts?: { force?: boolean }) => {
    if (!get().isPrefetched) {
      if (get().inFlightPrefetch) return;
      set({
        isPrefetching: true,
        inFlightPrefetch: true,
        error: null,
      });
      try {
        await get().fetchAllClientItems();
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
        await get().fetchClientItemsByLawyerId(lawyerId);
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
export const selectRecentClientItemsByClientId = (s: ClientItemState) =>
  s.recentClientItemsByClientId ?? EMPTY_CLIENT_ITEMS;

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
