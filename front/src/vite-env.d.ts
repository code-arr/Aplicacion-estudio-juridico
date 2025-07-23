/// <reference types="vite/client" />

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
      seleccionarArchivo: () => Promise<string>; // <-- Agregado
    };
  }
}
