import type { Client } from "@/types/Client";
import {
  getAllClients,
  getClientsByLawyerId,
  // ⚠️ Descomentar cuando exista en tu API:
  // getClientById,
} from "@/api/client";
import { useLawyerStore } from "@/store/useLawyerStore";
import { create } from "zustand";

const EMPTY_LIST = Object.freeze([] as Client[]);
const TTL_MS = 5 * 60 * 1000; // 5 min

interface ClientState {
  // ===== Colección GLOBAL (Admin) =====
  clientsAll: Client[];
  isLoadingAll: boolean;
  isRefreshingAll: boolean;
  isHydratedAll: boolean;
  errorAll: string | null;
  _inFlightAll: boolean; // privado: dedupe
  _lastAllAt?: number; // TTL

  // ===== Colección POR LAWYER =====
  clientsByLawyer: Client[] | null;
  isLoadingByLawyer: boolean;
  isRefreshingByLawyer: boolean;
  isHydratedByLawyer: boolean;
  errorByLawyer: string | null;
  _inFlightByLawyer: boolean; // privado: dedupe
  _lastByLawyerAt: number; // TTL por lawyer

  // ===== DETALLE por ID =====
  clientDetail: Client | null;
  isLoadingDetail: boolean;
  isRefreshingDetail: boolean;
  isHydratedDetail: boolean;
  errorDetail: string | null;
  _inFlightDetail: boolean; // privado: dedupe
  _lastByDetailAt: number; // TTL por id

  // ===== Filtros UI (simples) =====
  filters: { query: string; status?: string };
  setFilters: (p: Partial<ClientState["filters"]>) => void;

  // -------------------------------------------------------------
  // Acciones públicas: orquestan carga (TTL + dedupe) y escriben
  // -------------------------------------------------------------
  hydrateAll: (opts?: { force?: boolean }) => Promise<void>;
  hydrateByLawyer: (
    lawyerId: string,
    opts?: { force?: boolean }
  ) => Promise<void>;
  hydrateByDetail: (
    clientId: string,
    opts?: { force?: boolean }
  ) => Promise<void>;
  reset: () => void;

  // Setters públicos
  setAllClients: (clients: Client[]) => void;
  setClientsByLawyer: (clients: Client[]) => void;
  setClientDetail: (client: Client) => void;

  //Helpers publicos
  removeClientById: (clientId: string) => void;
  clearClientDetail: (clientId: string) => void;

  // Invalidadores (útiles para forzar reload)
  invalidateAll: () => void;
  invalidateByLawyer: (lawyerId: string) => void;
  invalidateById: (clientId: string) => void;
}

export const useClientStore = create<ClientState>()((set, get) => ({
  // ----------------------- Estado inicial -----------------------
  clientsAll: [],
  isLoadingAll: false,
  isRefreshingAll: false,
  isHydratedAll: false,
  errorAll: null,
  _inFlightAll: false,
  _lastAllAt: undefined,

  clientsByLawyer: null,
  isLoadingByLawyer: false,
  isRefreshingByLawyer: false,
  isHydratedByLawyer: false,
  errorByLawyer: null,
  _inFlightByLawyer: false,
  _lastByLawyerAt: 0,

  clientDetail: null,
  isLoadingDetail: false,
  isRefreshingDetail: false,
  isHydratedDetail: false,
  errorDetail: null,
  _inFlightDetail: false,
  _lastByDetailAt: 0,

  filters: { query: "", status: undefined },
  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),

  // ======================= HYDRATE: ALL =========================
  // Carga global para Admin. Respeta TTL y evita llamadas duplicadas.
  hydrateAll: async ({ force = false } = {}) => {
    const s = get();
    if (s._inFlightAll) return; // dedupe

    const fresh = !force && s._lastAllAt && Date.now() - s._lastAllAt < TTL_MS;
    if (fresh && s.isHydratedAll) return;

    // Mostrar "loading" en primera carga y "refreshing" si ya hay data
    if (s.isHydratedAll) {
      set({ isRefreshingAll: true, errorAll: null, _inFlightAll: true });
    } else {
      set({ isLoadingAll: true, errorAll: null, _inFlightAll: true });
    }

    try {
      const rows = await getAllClients();
      get().setAllClients(rows);
    } catch (e: any) {
      set({
        errorAll: e?.message ?? "No fue posible cargar los clientes (admin).",
        isHydratedAll: false,
      });
    } finally {
      set({ isLoadingAll: false, isRefreshingAll: false, _inFlightAll: false });
    }
  },

  // ==================== HYDRATE: BY LAWYER ======================
  // Carga por abogado. Si no pasás lawyerId, usa el del store actual.
  hydrateByLawyer: async (lawyerIdParam: string, { force = false } = {}) => {
    const s = get();
    if (s._inFlightByLawyer) return; // dedupe (simplificado a un in-flight global)

    const lawyerId =
      lawyerIdParam ?? useLawyerStore.getState().lawyer?.id ?? "";

    if (!lawyerId) {
      set({
        errorByLawyer:
          "No hay abogado activo. No es posible cargar los clientes.",
      });
      return;
    }

    const fresh =
      !force && s._lastByLawyerAt && Date.now() - s._lastByLawyerAt < TTL_MS;
    if (fresh && s.isHydratedByLawyer) return;

    // Mostrar "loading" en primera carga y "refreshing" si ya hay data
    if (s.isHydratedByLawyer) {
      set({
        isRefreshingByLawyer: true,
        errorByLawyer: null,
        _inFlightByLawyer: true,
      });
    } else {
      set({
        isLoadingByLawyer: true,
        errorByLawyer: null,
        _inFlightByLawyer: true,
      });
    }

    try {
      const rows = await getClientsByLawyerId(lawyerId);
      get().setClientsByLawyer(rows);
    } catch (e: any) {
      set({
        errorByLawyer:
          e?.message ?? "No fue posible cargar los clientes del abogado.",
        isHydratedByLawyer: false,
      });
    } finally {
      set({
        isLoadingByLawyer: false,
        isRefreshingByLawyer: false,
        _inFlightByLawyer: false,
      });
    }
  },

  // ==================== HYDRATE: DETAIL BY ID ===================
  // Carga el detalle de un cliente. Si no tenés endpoint, intenta
  // resolverlo desde las listas ya cargadas (ALL / BY_LAWYER).
  hydrateByDetail: async (clientId, { force = false } = {}) => {
    const s = get();
    if (s._inFlightDetail) return;

    const fresh =
      !force && s._lastByDetailAt && Date.now() - s._lastByDetailAt < TTL_MS;
    if (fresh && s.isHydratedDetail && s.clientDetail?.id === clientId) return;

    if (s.isHydratedDetail && s.clientDetail?.id === clientId) {
      set({
        isRefreshingDetail: true,
        errorDetail: null,
        _inFlightDetail: true,
      });
    } else {
      set({ isLoadingDetail: true, errorDetail: null, _inFlightDetail: true });
    }

    try {
      // const row = await getClientById(clientId);
      // get().setClientDetail(row);

      const fromAll = get().clientsAll.find((c) => c.id === clientId);
      if (fromAll) {
        get().setClientDetail(fromAll);
      } else {
        const fromByLawyer = get().clientsByLawyer?.find(
          (c) => c.id === clientId
        );
        if (fromByLawyer) {
          get().setClientDetail(fromByLawyer);
        } else {
          set({
            clientDetail: null,
            isHydratedDetail: false,
            errorDetail:
              "Cliente no encontrado en cache. Habilitá getClientById para traerlo del servidor.",
          });
        }
        if (!fromAll && !fromByLawyer) {
          // opcional: intentar hidratar por abogado y reintentar
          const lawyerId = useLawyerStore.getState().lawyer?.id;
          if (
            lawyerId &&
            !get().isHydratedByLawyer &&
            !get()._inFlightByLawyer
          ) {
            await get().hydrateByLawyer(lawyerId, { force: false });
            const retry = get().clientsByLawyer?.find((c) => c.id === clientId);
            if (retry) get().setClientDetail(retry);
          }
        }
      }
    } catch (e: any) {
      set({
        errorDetail: e?.message ?? "No se pudo cargar el cliente.",
        isHydratedDetail: false,
      });
    } finally {
      // 🔥 sin esto te queda clavado el spinner
      set({
        isLoadingDetail: false,
        isRefreshingDetail: false,
        _inFlightDetail: false,
      });
    }
  },
  reset: () =>
    set({
      clientsAll: [],
      clientsByLawyer: null,
      clientDetail: null,
      isHydratedAll: false,
      isHydratedByLawyer: false,
      isHydratedDetail: false,
      isLoadingAll: false,
      isLoadingByLawyer: false,
      isLoadingDetail: false,
      _lastAllAt: 0,
      _lastByLawyerAt: 0,
      _lastByDetailAt: 0,
      errorAll: null,
      errorByLawyer: null,
      errorDetail: null,
    }),

  // =========================== SETTERS ==========================
  // Útiles para sincronizar UI después de un CRUD sin re-fetch completo.
  setAllClients: (clients) =>
    set({
      clientsAll: clients,
      isHydratedAll: true,
      errorAll: null,
      _lastAllAt: Date.now(),
    }),

  setClientsByLawyer: (clients) =>
    set({
      clientsByLawyer: clients,
      isHydratedByLawyer: true,
      errorByLawyer: null,
      _lastByLawyerAt: Date.now(),
    }),

  setClientDetail: (client: Client) =>
    set({
      clientDetail: client,
      isHydratedDetail: true,
      errorDetail: null,
      _lastByDetailAt: Date.now(),
    }),

  // ======================== HELPERS =======================
  removeClientById: (id: string) =>
    set((s) => ({
      clientsAll: s.clientsAll.filter((c) => String(c.id) !== String(id)),
      clientsByLawyer: s.clientsByLawyer
        ? s.clientsByLawyer.filter((c) => String(c.id) !== String(id))
        : s.clientsByLawyer,
    })),

  clearClientDetail: (clientId: string) => {
    set((s) => (s.clientDetail?.id === clientId ? { clientDetail: null } : {}));
  },

  // ======================== INVALIDADORES =======================
  // Dejan el TTL vencido para que el próximo hydrate haga fetch real.
  invalidateAll: () => set({ _lastAllAt: undefined, isHydratedAll: false }),
  invalidateByLawyer: () =>
    set({ _lastByLawyerAt: 0, isHydratedByLawyer: false }),
  invalidateById: () => set({ _lastByDetailAt: 0, isHydratedDetail: false }),
}));

// ========================= SELECTORES ===========================

export const selectClientsAll = (s: ClientState) => s.clientsAll;
export const selectClientsByLawyer = (s: ClientState) =>
  s.clientsByLawyer ?? EMPTY_LIST;

export const selectClientDetail = (s: ClientState) => s.clientDetail;

export const selectFilters = (s: ClientState) => s.filters;

export const selectFilteredClientsByLawyer = (s: ClientState) => {
  const base = s.clientsByLawyer ?? EMPTY_LIST;
  const { query, status } = s.filters;
  const q = query.trim().toLowerCase();

  return base
    .filter((c) => !status || c.status === status)
    .filter((c) => {
      if (!q) return true;
      const name =
        c.companyName ??
        [c.firstName, c.lastName].filter(Boolean).join(" ") ??
        "";
      return (
        name.toLowerCase().includes(q) ||
        c.rut.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      );
    });
};

// Devuelve el cliente desde la cache (detail/all/byLawyer) o undefined.
// NO hace red, NO muta estado.
export const makeSelectClientFromCacheById =
  (clientId: string) =>
  (s: ClientState): Client | undefined => {
    // 1) Si el detail cargado coincide, lo devolvemos (es lo más completo)
    if (s.clientDetail?.id === clientId) return s.clientDetail;

    // 2) Buscar en la lista global (admin)
    const fromAll = s.clientsAll.find((c) => c.id === clientId);
    if (fromAll) return fromAll;

    // 3) Buscar en la lista por abogado (si existe)
    const fromByLawyer = s.clientsByLawyer?.find((c) => c.id === clientId);
    if (fromByLawyer) return fromByLawyer;

    return undefined;
  };

// Variante directa (no “make”), por si preferís pasar el id en uso:
export const selectClientFromCacheById = (s: ClientState, clientId: string) =>
  makeSelectClientFromCacheById(clientId)(s);
