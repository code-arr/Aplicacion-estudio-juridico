import { create } from "zustand";
import type {
  TopClientRaw,
  ClientDetailRaw,
  MonthlyTimeByLawyerRaw,
  StudyAveragesRes,
} from "@/types/EntryDay";
import {
  getTop10ByLawyer,
  getClientDetail,
  getMonthlyByLawyer,
  getStudyAverages,
} from "@/api/entryDay";

// TTL de cache (ms)
const TTL_MS = 5 * 60 * 1000;

type LoadingMap = {
  topClients: boolean;
  monthly: boolean;
  clientDetail: Record<string, boolean>; // por clientId
  studyAveragesLawyer?: boolean;
};

type ErrorMap = {
  topClients?: string;
  monthly?: string;
  clientDetail: Record<string, string | undefined>;
  studyAveragesLawyer?: string;
};

type CacheTimes = {
  topClients?: number;
  monthly?: number;
  clientDetail: Record<string, number | undefined>;
  studyAveragesLawyer?: number;
};

type StatsState = {
  // Datos RAW (en segundos)
  topClients: TopClientRaw[] | null;
  monthlyByLawyer: MonthlyTimeByLawyerRaw | null;
  clientDetails: Record<string, ClientDetailRaw | undefined>;
  studyAveragesLawyer: StudyAveragesRes | null;

  isLoading: LoadingMap;
  error: ErrorMap;
  _cacheAt: CacheTimes;

  fetchTopClients: (force?: boolean) => Promise<void>;
  fetchMonthlyByLawyer: (force?: boolean) => Promise<void>;
  fetchClientDetail: (clientId: string, force?: boolean) => Promise<void>;
  fetchStudyAveragesLawyer: (force?: boolean) => Promise<void>;
};

export const useStatsStore = create<StatsState>((set, get) => ({
  topClients: null,
  monthlyByLawyer: null,
  clientDetails: {},
  studyAveragesLawyer: null,

  isLoading: {
    topClients: false,
    monthly: false,
    clientDetail: {},
  },
  error: {
    clientDetail: {},
  },
  _cacheAt: {
    clientDetail: {},
  },

  // TOP CLIENTS (mes actual)
  fetchTopClients: async (force = false) => {
    const { _cacheAt, isLoading } = get();
    const now = Date.now();

    if (!force && _cacheAt.topClients && now - _cacheAt.topClients < TTL_MS) {
      return;
    }
    if (isLoading.topClients) return;

    set((s) => ({
      isLoading: { ...s.isLoading, topClients: true },
      error: { ...s.error, topClients: undefined },
    }));
    try {
      const data = await getTop10ByLawyer(); // ya incluye ?lawyerId=... desde tu axios base
      set((s) => ({
        topClients: data,
        _cacheAt: { ...s._cacheAt, topClients: now },
      }));
    } catch (err: any) {
      set((s) => ({
        error: {
          ...s.error,
          topClients: err?.message ?? "Error al cargar top clients",
        },
      }));
    } finally {
      set((s) => ({ isLoading: { ...s.isLoading, topClients: false } }));
    }
  },

  // MONTHLY por abogado (año actual)
  fetchMonthlyByLawyer: async (force = false) => {
    const { _cacheAt, isLoading } = get();
    const now = Date.now();

    if (!force && _cacheAt.monthly && now - _cacheAt.monthly < TTL_MS) {
      return;
    }
    if (isLoading.monthly) return;

    set((s) => ({
      isLoading: { ...s.isLoading, monthly: true },
      error: { ...s.error, monthly: undefined },
    }));
    try {
      const data = await getMonthlyByLawyer();
      set((s) => ({
        monthlyByLawyer: data,
        _cacheAt: { ...s._cacheAt, monthly: now },
      }));
    } catch (err: any) {
      set((s) => ({
        error: {
          ...s.error,
          monthly: err?.message ?? "Error al cargar horas mensuales",
        },
      }));
    } finally {
      set((s) => ({ isLoading: { ...s.isLoading, monthly: false } }));
    }
  },

  // DETAIL por cliente (año actual)
  fetchClientDetail: async (clientId: string, force = false) => {
    if (!clientId) return;
    const { _cacheAt, isLoading } = get();
    const now = Date.now();

    const cachedAt = _cacheAt.clientDetail[clientId];
    if (!force && cachedAt && now - cachedAt < TTL_MS) return;
    if (isLoading.clientDetail[clientId]) return;

    set((s) => ({
      isLoading: {
        ...s.isLoading,
        clientDetail: { ...s.isLoading.clientDetail, [clientId]: true },
      },
      error: {
        ...s.error,
        clientDetail: { ...s.error.clientDetail, [clientId]: undefined },
      },
    }));

    try {
      const data = await getClientDetail(clientId);
      set((s) => ({
        clientDetails: { ...s.clientDetails, [clientId]: data },
        _cacheAt: {
          ...s._cacheAt,
          clientDetail: { ...s._cacheAt.clientDetail, [clientId]: now },
        },
      }));
    } catch (err: any) {
      set((s) => ({
        error: {
          ...s.error,
          clientDetail: {
            ...s.error.clientDetail,
            [clientId]: err?.message ?? "Error al cargar detalle del cliente",
          },
        },
      }));
    } finally {
      set((s) => ({
        isLoading: {
          ...s.isLoading,
          clientDetail: { ...s.isLoading.clientDetail, [clientId]: false },
        },
      }));
    }
  },

  fetchStudyAveragesLawyer: async (force = false) => {
    const { _cacheAt, isLoading } = get();
    const now = Date.now();
    if (
      !force &&
      _cacheAt.studyAveragesLawyer &&
      now - _cacheAt.studyAveragesLawyer < TTL_MS
    )
      return;
    if (isLoading.studyAveragesLawyer) return;

    set((s) => ({
      isLoading: { ...s.isLoading, studyAveragesLawyer: true },
      error: { ...s.error, studyAveragesLawyer: undefined },
    }));
    try {
      // Si tu axios base ya inyecta ?lawyerId=..., no pases nada.
      const data = await getStudyAverages(); // { lawyerId } opcional
      set((s) => ({
        studyAveragesLawyer: data,
        _cacheAt: { ...s._cacheAt, studyAveragesLawyer: now },
      }));
    } catch (err: any) {
      set((s) => ({
        error: {
          ...s.error,
          studyAveragesLawyer:
            err?.message ?? "Error al cargar promedios del abogado",
        },
      }));
    } finally {
      set((s) => ({
        isLoading: { ...s.isLoading, studyAveragesLawyer: false },
      }));
    }
  },
}));
