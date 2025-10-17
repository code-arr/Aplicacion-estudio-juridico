//src/store/usePdfManagerStore.ts
import { create } from "zustand";
import type { OpenDoc } from "@/types/Document";

interface PdfManagerState {
  openDocs: OpenDoc[];
  activeDoc: { id: string | null; clientId: string | null } | null;

  open: (doc: OpenDoc) => void;
  close: (id: string) => void;
  setActiveDoc: (id: string | null, clientId: string | null) => void;
}

export const usePdfManagerStore = create<PdfManagerState>()((set, get) => ({
  openDocs: [],
  activeDoc: null,

  open: (doc) => {
    const { activeDoc, openDocs } = get();

    // Si ya está activo, no hagas nada (evitás renders y llamadas al store de sesión)
    if (activeDoc?.id === doc.id) return;

    const isAlreadyOpen = openDocs.some((d) => d.id === doc.id);

    // Un solo set: si existe lo activás; si no, lo agregás y activás
    set((s) =>
      isAlreadyOpen
        ? { ...s, activeDoc: { id: doc.id, clientId: doc.clientId } }
        : {
            openDocs: [...s.openDocs, doc],
            activeDoc: { id: doc.id, clientId: doc.clientId },
          }
    );
  },
  close: (id) => {
    const wasActive = get().activeDoc?.id === id;
    set((s) => {
      const idx = s.openDocs.findIndex((d) => d.id === id);
      if (idx === -1) return s;
      const next = s.openDocs.filter((d) => d.id !== id);

      // vecino izquierdo o primero
      const neighborIndex = Math.max(0, idx - 1);
      const newActive = next[neighborIndex] ?? null;

      return {
        openDocs: next,
        activeDoc: newActive
          ? { id: newActive.id, clientId: newActive.clientId }
          : { id: null, clientId: null },
      };
    });
  },
  setActiveDoc: (id, clientId) => {
    const { activeDoc, openDocs } = get();

    // 1) si no cambia, nada
    if (id === activeDoc?.id) return;

    // 2) si id no existe en openDocs y no es null, ignorar
    if (id !== null && !openDocs.some((d) => d.id === id)) return;

    // 3) resolver clientId:
    //    - si viene explícito, se respeta
    //    - si no viene, se infiere de openDocs (si id != null)
    const resolvedClientId: string | null =
      clientId ??
      (id ? openDocs.find((d) => d.id === id)?.clientId ?? null : null);

    set({ activeDoc: { id, clientId: resolvedClientId } });
  },
}));
