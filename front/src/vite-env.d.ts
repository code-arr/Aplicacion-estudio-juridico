/// <reference types="vite/client" />

import type { TimerEvent } from "@/types/Timer";

/**
 * Agregamos definiciones para que TypeScript sepa
 * qué es window.electronAPI y qué funciones tiene.
 */
export {};

declare global {
  interface Window {
    // ⬇️ NUEVO
    presence?: {
      subscribe: (
        cb: (
          ev:
            | "app:suspend"
            | "app:resume"
            | "app:lock"
            | "app:unlock"
            | "app:shutdown"
            | "app:minimized-all" // ⬅️ agregados
            | "app:restored-any" // ⬅️ agregados
        ) => void
      ) => () => void;
    };
    timerGlobal: {
      getSnapshot: () => Promise<{
        dayKey: string;
        accumSecToday: number;
        runningSince?: number | null;
      } | null>;
      setSnapshot: (snap: {
        dayKey: string;
        accumSecToday: number;
        runningSince?: number | null;
      }) => Promise<boolean>;
      clearSnapshot: () => Promise<boolean>;
    };
    electronAPI: {
      send: (channel: string, data?: any) => void;
      on: (
        channel: string,
        callback: (event: any, ...args: any[]) => void
      ) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      seleccionarArchivo: () => Promise<string | null>;
      // ⬇️ NUEVO
      timeQueue: {
        appendEntry: (entry: TimeEntry) => Promise<number>;
        getPending: () => Promise<TimeEntry[]>;
        setPending: (entries: TimeEntry[]) => Promise<number>;
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
