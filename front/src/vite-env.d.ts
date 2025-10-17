// src/vite-env.d.ts
/// <reference types="vite/client" />

import type { TimeEntry } from "@/types/Timer";

export {};

declare global {
  interface Window {
    device?: {
      getId: () => Promise<string>;
      ua?: string;
    };
    presence?: {
      subscribe: (
        cb: (
          ev:
            | "app:suspend"
            | "app:resume"
            | "app:lock"
            | "app:unlock"
            | "app:shutdown"
            | "app:minimized-all"
            | "app:restored-any"
        ) => void
      ) => () => void;
    };
    timer: {
      enable: (p: { lawyerId: string; appVersion?: string }) => Promise<any>;
      disable: (opts?: { preserveDay?: boolean }) => Promise<any>;
      markActivity: () => void;
      start: (t: { type: string; id: string }) => Promise<any>;
      pause: (
        p:
          | {
              reason: "idle" | "switch" | "close" | "logout" | "suspend";
              effectiveEndMs?: number;
            }
          | "idle"
          | "switch"
          | "close"
          | "logout"
          | "suspend"
      ) => Promise<any>;
      switchTo: (t: { type: string; id: string } | null) => Promise<any>;
      subscribe: (cb: (s: any) => void) => Promise<() => void>;
      workStart: () => Promise<any>;
      workPause: (effectiveEndMs?: number) => Promise<any>;
      alignedStop: (
        reason: "idle" | "switch" | "close" | "logout" | "suspend"
      ) => Promise<any>;
    };
    electronAPI: {
      send: (channel: string, data?: any) => void;
      on: (
        channel: string,
        callback: (event: any, ...args: any[]) => void
      ) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      seleccionarArchivo: () => Promise<string | null>;
      timeQueue: {
        appendEntry: (entry: TimeEntry) => Promise<number>;
        getPending: () => Promise<TimeEntry[]>;
        setPending: (entries: TimeEntry[]) => Promise<number>;
        clear: () => Promise<number>;
        count: () => Promise<number>;
      };
    };
    api: {
      openExternal: (url: string) => Promise<boolean>;
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
    audienceViewer: {
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
    authDeepLink?: {
      onResetLink: (cb: (token: string) => void) => () => void;
    };
  }
}
