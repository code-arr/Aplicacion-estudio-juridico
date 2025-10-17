// src/hooks/useResetDeepLink.ts
import { useEffect } from "react";

export function useResetDeepLink() {
  useEffect(() => {
    const api = window.authDeepLink;
    if (!api) return;

    const off = api.onResetLink((token) => {
      // navegación simple con HashRouter
      window.location.hash = `#/reset?token=${encodeURIComponent(token)}`;
    });

    return () => {
      try {
        off?.();
      } catch {}
    };
  }, []);
}
