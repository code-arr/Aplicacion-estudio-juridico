//src/store/usePdfManagerStore.ts
import { create } from "zustand";
import type { OpenDoc } from "@/types/Document";

interface PdfManagerState {
  openDocs: OpenDoc[];
  activeDoc: {
    id: string | null;
    clientId: string | null;
    clientItemId: string | null;
  } | null;

  open: (doc: OpenDoc) => void;
  close: (id: string) => void;
  setActiveDoc: (
    id: string | null,
    clientId: string | null,
    clientItemId?: string | null
  ) => void;
}

export const usePdfManagerStore = create<PdfManagerState>()((set, get) => ({
  openDocs: [],
  activeDoc: null,

  open: (doc) => {
    const { activeDoc, openDocs } = get();
    if (activeDoc?.id === doc.id) return;

    const isAlreadyOpen = openDocs.some((d) => d.id === doc.id);

    set((s) =>
      isAlreadyOpen
        ? {
            ...s,
            activeDoc: {
              id: doc.id,
              clientId: doc.clientId,
              clientItemId: doc.clientItemId,
            },
          }
        : {
            openDocs: [...s.openDocs, doc],
            activeDoc: {
              id: doc.id,
              clientId: doc.clientId,
              clientItemId: doc.clientItemId,
            },
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
          ? {
              id: newActive.id,
              clientId: newActive.clientId,
              clientItemId: newActive.clientItemId,
            }
          : { id: null, clientId: null, clientItemId: null },
      };
    });
  },
  setActiveDoc: (id, clientId, clientItemId) => {
    const { activeDoc, openDocs } = get();
    if (id === activeDoc?.id) return;

    if (id !== null && !openDocs.some((d) => d.id === id)) return;

    const resolved = id ? openDocs.find((d) => d.id === id) : null;
    set({
      activeDoc: {
        id,
        clientId: clientId ?? resolved?.clientId ?? null,
        clientItemId: clientItemId ?? resolved?.clientItemId ?? null, // ➕
      },
    });
  },
}));
