// src/store/useAudienceStore.ts
import { create } from "zustand";
import type { Process } from "@/types/Process";
import { deleteProcess, getProcessesByClientItem } from "@/api/process";

// TTL simple para cache (opcional)
const TTL_MS = 5 * 60 * 1000;

type ProcessState = {
  processes: Process[];
  processesByClient: Process[];
  processesByClientItem: Process[];
  selectedProcess: Process | null;
  selectedProcesses: Process[];

  isLoading?: boolean;
  error?: string;

  // acciones sync
  setProcess: (processes: Process[]) => void;
  setProcessesByClient: (processes: Process[]) => void;
  setProcessesByClientItem: (processes: Process[]) => void;
  deleteProcessById: (p: Process) => Promise<void>;

  fetchProcesses: () => Promise<void>;
  fetchProcessesByClient: (clientId: string) => Promise<void>;
  fetchProcessesByClientItemId: (clientItemId: string) => Promise<void>;
};

export const useProcessStore = create<ProcessState>((set, get) => ({
  processes: [],
  processesByClient: [],
  processesByClientItem: [],
  selectedProcess: null,
  selectedProcesses: [],

  isLoading: false,
  error: undefined,

  setProcess: (processes: Process[]) => {
    set({ processes });
  },
  setProcessesByClient: (processes: Process[]) => {
    set({ processesByClient: processes });
  },
  setProcessesByClientItem: (processes: Process[]) => {
    set({ processesByClientItem: processes });
  },
  deleteProcessById: async (p) => {
    const prev = get().processesByClientItem;
    if (!prev.some((x) => x.id === p.id)) return;

    // ✅ optimista
    set({ processesByClientItem: prev.filter((x) => x.id !== p.id) });

    try {
      await deleteProcess(p.id!);
    } catch (e) {
      // 🔁 rollback
      set({ processesByClientItem: prev });
      throw e;
    }
  },

  fetchProcesses: async () => {},
  fetchProcessesByClient: async (clientId: string) => {},
  fetchProcessesByClientItemId: async (clientItemId: string) => {
    set({ isLoading: true, error: undefined });
    try {
      const data = await getProcessesByClientItem(clientItemId);
      set({ processesByClientItem: data, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e?.message ?? "Error al cargar audiencias",
      });
    }
  },
}));
