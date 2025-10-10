// src/store/useAudienceStore.ts
import { create } from "zustand";
import type { Meeting } from "@/types/Meeting";
import { getMeetingsByClientItem } from "@/api/meeting";

// TTL simple para cache (opcional)
const TTL_MS = 5 * 60 * 1000;

type MeetingState = {
  meetings: Meeting[];
  meetingsByClient: Meeting[];
  meetingsByClientItem: Meeting[];
  selectedMeeting: Meeting | null;
  selectedMeetings: Meeting[];

  isLoading?: boolean;
  error?: string;

  // acciones sync
  setMeetings: (meetings: Meeting[]) => void;
  setMeetingsByClient: (meetings: Meeting[]) => void;
  setMeetingsByClientItem: (meetings: Meeting[]) => void;

  fetchMeetings: () => Promise<void>;
  fetchMeetingsByClient: (clientId: string) => Promise<void>;
  fetchMeetingsByClientItemId: (clientItemId: string) => Promise<void>;
};

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meetings: [],
  meetingsByClient: [],
  meetingsByClientItem: [],
  selectedMeeting: null,
  selectedMeetings: [],

  isLoading: false,
  error: undefined,

  setMeetings: (meetings: Meeting[]) => {
    set({ meetings });
  },
  setMeetingsByClient: (meetings: Meeting[]) => {
    set({ meetingsByClient: meetings });
  },
  setMeetingsByClientItem: (meetings: Meeting[]) => {
    set({ meetingsByClientItem: meetings });
  },

  fetchMeetings: async () => {},
  fetchMeetingsByClient: async (clientId: string) => {},
  fetchMeetingsByClientItemId: async (clientItemId: string) => {
    set({ isLoading: true, error: undefined });
    try {
      const data = await getMeetingsByClientItem(clientItemId);
      set({ meetingsByClientItem: data, isLoading: false });
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
