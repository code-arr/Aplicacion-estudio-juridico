// src/hooks/useTimeSyncInit.ts
import { useEffect } from "react";
import { initTimerPersistenceAndSync } from "@/store/timer/useTimerStore";

export function useTimeSyncInit(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // init async
    void initTimerPersistenceAndSync();
  }, [enabled]);
}
