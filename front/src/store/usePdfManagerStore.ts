import { create } from "zustand";
import type { OpenDoc } from "@/types/Document";
import { usePdfSessionStore } from "./usePdfSession";

interface PdfManagerState {
  openDocs: OpenDoc[];
  activeDocId: string | null;

  open: (doc: OpenDoc) => void;
  close: (id: string) => void;
  setActiveDocId: (id: string | null) => void;
}

export const usePdfManagerStore = create<PdfManagerState>()((set, get) => ({
  openDocs: [],
  activeDocId: null,

  open: (doc: OpenDoc) => {
    const { activeDocId, openDocs } = get();

    // Si ya está activo, no hagas nada (evitás renders y llamadas al store de sesión)
    if (activeDocId === doc.id) return;

    const isAlreadyOpen = openDocs.some((d) => d.id === doc.id);

    // Un solo set: si existe lo activás; si no, lo agregás y activás
    set((s) =>
      isAlreadyOpen
        ? { ...s, activeDocId: doc.id }
        : { openDocs: [...s.openDocs, doc], activeDocId: doc.id }
    );

    // Orquesta exclusividad + flush/pausa/reanudar en el store de sesión
    // (pasa versionId si tu OpenDoc lo trae)
    usePdfSessionStore.getState().setActiveDoc(doc.id);
  },
  close: async (id: string) => {
    const wasActive = get().activeDocId === id;
    if (wasActive) {
      await usePdfSessionStore.getState().flushRemainder(id);
    }

    set((s) => {
      const idx = s.openDocs.findIndex((d) => d.id === id);
      if (idx === -1) return s; // nada que cerrar

      const next = s.openDocs.filter((d) => d.id !== id);

      let newActiveId = s.activeDocId;
      if (wasActive) {
        // vecino izquierdo si existe, sino el primero de la lista nueva
        const neighborIndex = Math.max(0, idx - 1);
        newActiveId = next[neighborIndex]?.id ?? null;
      }

      return { openDocs: next, activeDocId: newActiveId };
    });

    if (wasActive) {
      const newId = get().activeDocId; // ya actualizado
      usePdfSessionStore.getState().setActiveDoc(newId ?? null);
    }
  },
  setActiveDocId: (id: string | null) => {
    const { activeDocId, openDocs } = get();

    // 1) Si no cambia, no hacemos nada
    if (id === activeDocId) return;

    // 2) Si nos pasan un id que no está abierto, ignoramos (no abrimos acá)
    if (id !== null && !openDocs.some((d) => d.id === id)) return;

    // 3) Guardamos el doc (por si queremos pasar versionId al store de sesión)
    /*     const targetDoc = id ? openDocs.find((d) => d.id === id) : null;
    const versionId = (targetDoc as any)?.versionId as string | undefined; */

    // 4) Un solo set: cambiamos el activo (puede ser null)
    set({ activeDocId: id });

    // 5) Orquestamos con el store de sesión (pausa/flush del anterior y resume del nuevo)
    usePdfSessionStore.getState().setActiveDoc(id);
  },
}));
