// src/hooks/useTimeSyncInit.ts
import { useEffect } from "react";
import { useTimerUIStore } from "@/store/useTimerUIStore";

export function useTimeSyncInit(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    // Suscribe el store UI al estado del motor (main)
    void useTimerUIStore.getState().bindToMain();
  }, [enabled]);
}
