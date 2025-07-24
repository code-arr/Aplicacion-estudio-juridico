import type { Lawyer } from "@/types/Lawyer";
import { create } from "zustand";

interface LawyerState {
  lawyer: Lawyer | null;
  setLawyer: (lawyer: Lawyer) => void;
  resetLawyer: () => void;
}

export const useLawyerStore = create<LawyerState>()((set) => ({
  lawyer: null,
  setLawyer: (lawyer) => set({ lawyer }),
  resetLawyer: () => set({ lawyer: null }),
}));
