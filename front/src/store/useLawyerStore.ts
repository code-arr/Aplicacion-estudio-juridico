import type { Lawyer } from "@/types/Lawyer";
import { getLawyerByEmail, getAllLawyers } from "@/api/lawyer";
import { create } from "zustand";

interface LawyerState {
  lawyer: Lawyer | null;
  lawyers?: Lawyer[];
  setLawyer: (email: string) => void;
  fetchAllLawyers: () => Promise<void>;
  resetLawyer: () => void;
}

export const useLawyerStore = create<LawyerState>()((set) => ({
  lawyer: null,
  lawyers: undefined,
  setLawyer: async (email: string) => {
    const lawyer = await getLawyerByEmail(email);

    set({ lawyer });
  },
  fetchAllLawyers: async () => {
    try {
      const data = await getAllLawyers();
      set({ lawyers: data });
    } catch (e) {
      set({ lawyers: [] });
    }
  },
  resetLawyer: () => set({ lawyer: null }),
}));
