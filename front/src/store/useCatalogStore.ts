import { create } from "zustand";
import type { Category, Section, ItemType } from "@/types/Catalog";
import { getCatalogData } from "@/api/catalog";

const EMPTY_CATEGORIES: Category[] = Object.freeze([]);
const EMPTY_SECTIONS: Section[] = Object.freeze([]);
const EMPTY_ITEMTYPES: ItemType[] = Object.freeze([]);
const ttlMs = 86400000;

interface CatalogState {
  categories: Category[];
  sections: Section[];
  itemTypes: ItemType[];

  isLoading: boolean;
  isHydrated: boolean;
  isRefreshing: boolean;
  inFlight: boolean;

  error: string | null;

  lastFetched: number;

  setCatalog: (data: {
    categories: Category[];
    sections: Section[];
    itemTypes: ItemType[];
  }) => void;
  fetchCatalog: () => Promise<void>;
  hydrate: (opts?: { force?: boolean }) => Promise<void>;
  refreshCatalog: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  categories: [],
  sections: [],
  itemTypes: [],
  isLoading: false,
  isHydrated: false,
  isRefreshing: false,
  inFlight: false,
  error: null,
  lastFetched: 0,

  setCatalog: ({ categories = [], sections = [], itemTypes = [] }) => {
    set({
      categories,
      sections,
      itemTypes,
      isLoading: false,
      isHydrated: true,
      isRefreshing: false,
      inFlight: false,
      error: null,
      lastFetched: Date.now(),
    });
  },

  fetchCatalog: async () => {
    const data = await getCatalogData();
    if (data.categories.length < 1) console.log("Categorias no tiene datos");
    //Deberia mostrar un toast que diga eso
    get().setCatalog(data);
  },

  hydrate: async (opts?: { force?: boolean }) => {
    if (get().inFlight) return; // evitar dos llamadas simultáneas
    const isFresh =
      get().lastFetched > 0 && Date.now() - get().lastFetched < ttlMs;
    if (!opts?.force && isFresh) {
      if (get().error) set({ error: null });
      return;
    }

    if (get().isHydrated)
      set({ isRefreshing: true, inFlight: true, error: null });
    else set({ isLoading: true, inFlight: true, error: null });

    try {
      await get().fetchCatalog();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible cargar los datos: Catálogo";

      set({
        error: message,
      });
    } finally {
      set({ inFlight: false, isLoading: false, isRefreshing: false });
    }
  },
  refreshCatalog: async () => {
    if (get().inFlight) return;
    set({ isRefreshing: true, inFlight: true, error: null });
    try {
      await get().fetchCatalog();
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Error al refrescar catálogo",
      });
    } finally {
      set({ isRefreshing: false, inFlight: false });
    }
  },
}));

export const selectCatalog = (s: CatalogState) => {
  const catalog = {
    categories: s.categories,
    sections: s.sections,
    itemTypes: s.itemTypes,
  };
  return catalog;
};

export const selectCategories = (s: CatalogState) => s.categories;
export const selectSections = (s: CatalogState) => s.sections;
export const selectItemTypes = (s: CatalogState) => s.itemTypes;

export const selectIsCatalogLoading = (s: CatalogState) => s.isLoading;
export const selectIsCatalogRefreshing = (s: CatalogState) => s.isRefreshing;
export const selectIsCatalogHydrated = (s: CatalogState) => s.isHydrated;

export const selectCatalogError = (s: CatalogState) => s.error;
