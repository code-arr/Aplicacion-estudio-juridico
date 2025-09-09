import type { Lawyer } from "@/types/Lawyer";
import { getLawyerByEmail } from "@/api/lawyer";
import { create } from "zustand";

interface LawyerState {
  lawyer: Lawyer | null;
  setLawyer: (email: string) => void;
  resetLawyer: () => void;
}

export const useLawyerStore = create<LawyerState>()((set) => ({
  lawyer: null,
  setLawyer: async (email: string) => {
    const lawyer = await getLawyerByEmail(email);

    set({ lawyer });
  },
  resetLawyer: () => set({ lawyer: null }),
}));
