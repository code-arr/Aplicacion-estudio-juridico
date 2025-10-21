// src/store/useAudienceStore.ts
import { create } from "zustand";
import type { Meeting } from "@/types/Meeting";
import {
  getMeetingsByClientItem,
  getMeetingsByClient,
  cancelMeeting,
  deleteMeeting,
} from "@/api/meeting";

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
  cancelMeetingById: (m: Meeting, lawyerEmail: string) => Promise<void>;
  deleteMeetingById: (m: Meeting) => Promise<void>;

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
  cancelMeetingById: async (m, lawyerEmail) => {
    const prev = get().meetingsByClientItem;
    const idx = prev.findIndex((x) => x.id === m.id);
    if (idx === -1) return;

    // ✅ optimista
    const next = [...prev];
    next[idx] = { ...next[idx], status: "canceled" as const };
    set({ meetingsByClientItem: next });

    try {
      await cancelMeeting(m.id, lawyerEmail);
    } catch (e) {
      // 🔁 rollback
      set({ meetingsByClientItem: prev });
      throw e;
    }
  },
  deleteMeetingById: async (m) => {
    const current = get().meetingsByClientItem;
    if (!current.some((x) => x.id === m.id)) return;

    // optimista
    set({ meetingsByClientItem: current.filter((x) => x.id !== m.id) });
    set({ meetingsByClient: current.filter((x) => x.id !== m.id) });

    try {
      await deleteMeeting(m.id);
      // ok, nada más
    } catch (e) {
      // rollback
      set({ meetingsByClientItem: current });
      throw e;
    }
  },

  fetchMeetings: async () => {},
  fetchMeetingsByClient: async (clientId: string) => {
    set({ isLoading: true, error: undefined });
    try {
      const data = await getMeetingsByClient(clientId);
      set({ meetingsByClient: data, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e?.message ?? "Error al cargar reuniones",
      });
    }
  },
  fetchMeetingsByClientItemId: async (clientItemId: string) => {
    set({ isLoading: true, error: undefined });
    try {
      const data = await getMeetingsByClientItem(clientItemId);
      set({ meetingsByClientItem: data, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e?.message ?? "Error al cargar reuniones",
      });
    }
  },
}));

// --- Selectores auxiliares (opcionales), para mantener limpio el componente
/* export function selectAudiences(itemId: string) {
  const st = useAudienceStore.getState();
  return st.byItemId[itemId]?.data ?? [];
} */
