// src/store/useAudienceStore.ts
import { create } from "zustand";
import type { Audience } from "@/types/Audience";
import { getAudiencesByClientItem } from "@/api/audience";

// TTL simple para cache (opcional)
const TTL_MS = 5 * 60 * 1000;

/* type AudienceFilters = {
  query: string;
  type?: AudienceType | "all";
  outcome?: AudienceOutcome | "all";
  dateRange?: { from?: string; to?: string }; // ISO
}; */

// --- Estado
/* type Bucket = {
  data: ItemAudience[];
  fetchedAt: number;
}; */

type AudienceState = {
  audiences: Audience[];
  audiencesByClient: Audience[];
  audiencesByClientItem: Audience[];
  selectedAudience: Audience | null;
  selectedAudiences: Audience[];

  isLoading?: boolean;
  error?: string;

  // acciones sync
  setAudiences: (audiences: Audience[]) => void;
  setAudiencesByClient: (audiences: Audience[]) => void;
  setAudiencesByClientItem: (audiences: Audience[]) => void;

  fetchAudiences: () => Promise<void>;
  fetchAudiencesByClient: (clientId: string) => Promise<void>;
  fetchAudiencesByClientItemId: (clientItemId: string) => Promise<void>;
};

export const useAudienceStore = create<AudienceState>((set, get) => ({
  audiences: [],
  audiencesByClient: [],
  audiencesByClientItem: [],
  selectedAudience: null,
  selectedAudiences: [],

  isLoading: false,
  error: undefined,

  setAudiences: (audiences: Audience[]) => {
    set({ audiences });
  },
  setAudiencesByClient: (audiences: Audience[]) => {
    set({ audiencesByClient: audiences });
  },
  setAudiencesByClientItem: (audiences: Audience[]) => {
    set({ audiencesByClientItem: audiences });
  },

  fetchAudiences: async () => {},
  fetchAudiencesByClient: async (clientId: string) => {},
  fetchAudiencesByClientItemId: async (clientItemId: string) => {
    set({ isLoading: true, error: undefined });
    try {
      const data = await getAudiencesByClientItem(clientItemId);
      set({ audiencesByClientItem: data, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e?.message ?? "Error al cargar audiencias",
      });
    }
  },
}));

// --- Selectores auxiliares (opcionales), para mantener limpio el componente
/* export function selectAudiences(itemId: string) {
  const st = useAudienceStore.getState();
  return st.byItemId[itemId]?.data ?? [];
} */

// Adapter útil para el visor (usás el mismo motor de Documentos)
export function audienceToOpenDoc(a: Audience) {
  return { id: `${a.id}`, name: a.name, url: a.fileUrl, clientId: a.clientId };
}
