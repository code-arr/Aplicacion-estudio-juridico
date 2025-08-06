import { create } from "zustand";
import type { Category, Section, ItemType } from "@/types/Catalog";

interface CatalogStore {
  categories: Category[];
  sections: Section[];
  itemTypes: ItemType[];

  setCatalogData: (data: {
    categories: Category[];
    sections: Section[];
    itemTypes: ItemType[];
  }) => void;
}

export const useCatalogStore = create<CatalogStore>((set) => ({
  categories: [],
  sections: [],
  itemTypes: [],

  setCatalogData: ({ categories, sections, itemTypes }) =>
    set({ categories, sections, itemTypes }),
}));
