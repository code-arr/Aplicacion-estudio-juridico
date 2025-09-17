/// <reference types="vite/client" />

import type { TimerEvent } from "@/types/Timer";

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
        append: (entry: TimerEvent) => Promise<number | void>;
        getPending: () => Promise<TimerEvent[]>;
        setPending: (entries: TimerEvent[]) => Promise<number | void>;
        clear: () => Promise<number | void>;
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
    audienceViewer?: {
      open: (payload: {
        audiences: any[];
        activeId?: string | null;
      }) => Promise<boolean>;
      addDocs: (payload: {
        audiences: any[];
        activeId?: string | null;
      }) => void;
      close: () => void;
      onAddDocs: (
        cb: (payload: { audiences: any[]; activeId?: string | null }) => void
      ) => () => void;
    };
  }
}
