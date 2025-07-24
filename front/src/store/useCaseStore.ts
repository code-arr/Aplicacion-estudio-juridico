import type { Case } from "@/types/Case";
import { create } from "zustand";

interface CaseStore {
  legalCase: Case | null;
  setLegalCase: (legalCase: Case) => void;
  resetLegalCase: () => void;
}

export const useCaseStore = create<CaseStore>()((set) => ({
  legalCase: null,
  setLegalCase: (legalCase) => set({ legalCase }),
  resetLegalCase: () => set({ legalCase: null }),
}));
