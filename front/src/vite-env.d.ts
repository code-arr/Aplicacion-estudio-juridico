/// <reference types="vite/client" />

import type { HeartbeatEntry } from "../electron/store/timeBufferStore";

/**
 * Agregamos definiciones para que TypeScript sepa
 * qué es window.electronAPI y qué funciones tiene.
 */
export {};

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data?: any) => void;
      on: (
        channel: string,
        callback: (event: any, ...args: any[]) => void
      ) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      seleccionarArchivo: () => Promise<string | null>;
      timeBuffer: {
        append: (entry: {
          docId: string;
          versionId?: string;
          deltaSec: number;
          clientTs: string;
        }) => Promise<number>;
        getPending: () => Promise<
          Array<{
            docId: string;
            versionId?: string;
            deltaSec: number;
            clientTs: string;
          }>
        >;
        setPending: (
          entries: Array<{
            docId: string;
            versionId?: string;
            deltaSec: number;
            clientTs: string;
          }>
        ) => Promise<number>;
        clear: () => Promise<number>;
        count: () => Promise<number>;
      };
    };
    viewer: {
      open: (payload: {
        docs: any[];
        activeId?: string | null;
      }) => Promise<any>;
      addDocs: (payload: { docs: any[]; activeId?: string | null }) => void;
      close: () => void;
      onAddDocs: (
        cb: (payload: { docs: any[]; activeId?: string | null }) => void
      ) => () => void;
    };
  }
}
