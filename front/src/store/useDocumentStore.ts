import { create } from "zustand";
import type { Document } from "@/types/Document";
import { getDocumentsByClientItem } from "@/api/document";

interface DocumentState {
  documents: Document[];
  documentsByClient: Document[];
  documentsByClientItem: Document[];
  selectedDocument: Document | null;
  selectedDocuments: Document[];

  setDocuments: (documents: Document[]) => void;
  setDocumentsByClient: (documents: Document[]) => void;
  setDocumentsByClientItem: (documents: Document[]) => void;
  setSelectedDocument: (documentId: string) => void;
  addSelectedDocument: () => void;
  removeSelectedDocument: (id: string) => void;
  clearSelectedDocuments: () => void;

  fetchDocuments: () => Promise<void>;
  fetchDocumentsByClient: (clientId: string) => Promise<void>;
  fetchDocumentsByClientItemId: (clientItemId: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  documents: [],
  documentsByClient: [],
  documentsByClientItem: [],
  selectedDocument: null,
  selectedDocuments: [],

  setDocuments: (documents: Document[]) => {
    set({ documents });
  },
  setDocumentsByClient: (documents: Document[]) => {
    set({ documentsByClient: documents });
  },
  setDocumentsByClientItem: (documents: Document[]) => {
    set({ documentsByClientItem: documents });
  },
  setSelectedDocument: (documentId: string) => {
    const found =
      get().documentsByClientItem.find((d) => d.id === documentId) ?? null;
    set({ selectedDocument: found });
  },
  addSelectedDocument: () => {
    const selected = get().selectedDocument;
    if (!selected) return;

    set((state) => {
      const exists = state.selectedDocuments.some((d) => d.id === selected.id);
      return exists
        ? state
        : { selectedDocuments: [...state.selectedDocuments, selected] };
    });
  },
  removeSelectedDocument: (id: string) =>
    set((state) => ({
      selectedDocuments: state.selectedDocuments.filter((d) => d.id !== id),
    })),
  clearSelectedDocuments: () => set({ selectedDocuments: [] }),

  fetchDocuments: async () => {},
  fetchDocumentsByClient: async (clientId: string) => {},
  fetchDocumentsByClientItemId: async (clientItemId: string) => {
    if (clientItemId) {
      const data = await getDocumentsByClientItem(clientItemId);
      get().setDocumentsByClientItem(data);
    }
  },
}));
