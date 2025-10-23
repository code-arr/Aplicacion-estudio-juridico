// src/hooks/useClientTime.ts
import { useMemo } from "react";
import { useStatsStore } from "@/store/useStatsStore";

type ClientTime = { totalSeconds: number; monthSeconds: number };

export function useClientTime(clientId?: string | null): ClientTime {
  const statsMap = useStatsStore((s) => s.clientDetails);
  const stats = clientId ? statsMap[clientId] : undefined;

  return useMemo(() => {
    if (!clientId || !stats) return { totalSeconds: 0, monthSeconds: 0 };

    // 1) Total acumulado (suma de los días como fuente primaria)
    const totalByDay = (stats.totalByDay ?? {}) as Record<string, number>;
    const sumDays = Object.values(totalByDay).reduce((a, b) => a + (b ?? 0), 0);

    // Fallback si no hay días pero sí totalByYear
    const totalSeconds =
      sumDays > 0
        ? sumDays
        : typeof stats.totalByYear === "number"
        ? stats.totalByYear
        : 0;

    // 2) Mes actual (1–12). En tu payload las keys son números (ej: 10)
    const monthIdx = new Date().getMonth() + 1;
    const byMonth = (stats.totalByMonth ?? {}) as Record<
      string | number,
      number
    >;
    const monthSeconds = byMonth[monthIdx] ?? 0;

    return { totalSeconds, monthSeconds };
  }, [clientId, stats]);
}
