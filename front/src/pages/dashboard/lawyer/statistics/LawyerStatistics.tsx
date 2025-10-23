// src/pages/dashboard/lawyer/statistics/LawyerStatistics.tsx
import React, { useEffect, useMemo } from "react";
import ClientStatsCard from "@/components/clients/ClientStatsCard";
import { useFocusContext } from "@/hooks/useFocusContext";
import { useStatsStore } from "@/store/useStatsStore";
import { mapMonthlyToSeries, secToHours, sumMonth } from "@/utils/timeMaps";
import {
  selectClientItems,
  useClientItemStore,
} from "@/store/useClientItemStore";
import ClientCasesStatsCard from "@/components/clients/ClientCasesStatsCard";

// =============================
// Types
// =============================
export type WeekHours = { label: string; hours: number };
export type StageCount = { stage: string; count: number };
export type TopClient = { name: string; hours: number };

export interface LawyerKpis {
  activeItems: number;
  billableHoursThisMonth: number; // horas facturables (mes actual)
  collectionRate: number | null; // % cobrado/facturado (mes actual) o null para N/A
  avgResolutionDays: number; // promedio de resolución últimos 90 días
}

export interface LawyerStatisticsProps {
  kpis?: LawyerKpis;
  hoursByWeek?: WeekHours[];
  casesByStage?: StageCount[];
  topClients?: TopClient[];
  className?: string;
}

// =============================
// Helpers
// =============================
const formatNumber = (n: number, digits = 1) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

// =============================
// Small UI atoms
// =============================
function Card({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-2xl border border-black/10 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-3xl font-semibold leading-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">
        {label}
        {hint ? " · " : ""}
        <span className="text-slate-400">{hint}</span>
      </div>
    </Card>
  );
}

/* function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`h-2 w-full rounded-full bg-slate-200 ${className}`}
      aria-hidden
    >
      <div
        className="h-2 rounded-full bg-slate-800"
        style={{ width: `${clamp(value, 0, 100)}%` }}
      />
    </div>
  );
} */

// =============================
// Demo fallbacks (solo por si no hay datos aún)
// =============================
const demoKpis: LawyerKpis = {
  activeItems: 0,
  billableHoursThisMonth: 0,
  collectionRate: null,
  avgResolutionDays: 0,
};

const demoMonthly: WeekHours[] = [
  { label: "Ene", hours: 0 },
  { label: "Feb", hours: 0 },
  { label: "Mar", hours: 0 },
  { label: "Abr", hours: 0 },
  { label: "May", hours: 0 },
  { label: "Jun", hours: 0 },
  { label: "Jul", hours: 0 },
];

// =============================
// Main component
// =============================
const LawyerStatistics = ({ className = "" }: LawyerStatisticsProps) => {
  useFocusContext({ type: "LawyerApp", id: "main" });

  const itemsByLawyer = useClientItemStore(selectClientItems);

  const {
    topClients,
    monthlyByLawyer,
    isLoading,
    error,
    fetchTopClients,
    fetchMonthlyByLawyer,
  } = useStatsStore();

  useEffect(() => {
    fetchTopClients();
    fetchMonthlyByLawyer();
  }, [fetchTopClients, fetchMonthlyByLawyer]);

  // ✨ CAMBIO: calcular KPIs con datos reales (solo “Horas (mes act.)” por ahora)
  const kpis: LawyerKpis = useMemo(() => {
    const billableHoursThisMonth = monthlyByLawyer
      ? sumMonth(monthlyByLawyer) // convierte a horas adentro
      : 0;

    // Los otros KPI aún no tienen endpoint → los dejamos en 0/N/A
    return {
      ...demoKpis,
      billableHoursThisMonth,
    };
  }, [monthlyByLawyer]);

  // ✨ CAMBIO: serie “Horas por mes (año)” mapeada desde el back
  const monthlySeries: WeekHours[] = useMemo(() => {
    if (!monthlyByLawyer) return demoMonthly;

    // Traigo 10 últimos del helper (orden ASC por defecto)…
    const pts10 = mapMonthlyToSeries(monthlyByLawyer, 10);

    // …me quedo con los últimos 7 y los invierto para mostrar: más reciente → más viejo (arriba→abajo)
    const last7Desc = pts10.slice(-7).reverse();

    return last7Desc.map((p) => ({ label: p.label, hours: p.hours }));
  }, [monthlyByLawyer]);

  // ✨ CAMBIO: Top clientes (tabla derecha) con datos reales
  const topClientRows = (
    topClients?.map((c) => ({
      name: c.firstName || "Desconocido",
      hours: secToHours(c.totalTime),
    })) ?? []
  ).slice(0, 7); // 👈 muestra 7

  return (
    <div className="bg-gradient-to-t from-[#334155] via-[#3b4d66] to-[#60a5fa]/20 min-h-screen">
      <div className={`w-full p-4 lg:p-6 ${className}`}>
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Item activos" value={itemsByLawyer.length} />
          <StatCard
            label="Horas (mes at.)"
            value={formatNumber(kpis.billableHoursThisMonth)}
          />
          <StatCard
            label="Tasa de cobro"
            value={
              kpis.collectionRate == null
                ? "N/A"
                : `${formatNumber(kpis.collectionRate, 0)}%`
            }
            hint="% mes actual"
          />
          <StatCard
            label="Prom. resolución"
            value={kpis.avgResolutionDays}
            hint="últimos 90 días"
          />
        </div>
        {/* 2 columnas */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Horas por semana */}
          <Card className="p-5">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Horas por mes (año)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-[480px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pt-1 pb-3 font-normal">Mes</th>
                    <th className="pt-1 pb-3 font-normal text-right">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlySeries.map((m) => (
                    <tr key={m.label}>
                      <td className="py-2 text-slate-800">{m.label}</td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        {`${formatNumber(m.hours)}hs`}
                      </td>
                    </tr>
                  ))}
                  {!monthlySeries.length && (
                    <tr>
                      <td colSpan={2} className="py-2 text-slate-500">
                        {isLoading.monthly
                          ? "Cargando..."
                          : error.monthly || "Sin datos"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top clientes */}
          <Card className="p-5">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Top clientes (horas mes)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-[480px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pt-1 pb-3 font-normal">Cliente</th>
                    <th className="pt-1 pb-3 font-normal text-right">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topClientRows.map((c) => (
                    <tr key={c.name}>
                      <td className="py-2 text-slate-800">{c.name}</td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        {`${formatNumber(c.hours)}hs`}
                      </td>
                    </tr>
                  ))}
                  {!topClientRows.length && (
                    <tr>
                      <td colSpan={2} className="py-2 text-slate-500">
                        {isLoading.topClients
                          ? "Cargando..."
                          : error.topClients || "Sin datos"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        {/* Tiempo por cliente */}
        <div className="mt-4 grid grid-cols-1 gap-4 ">
          <ClientStatsCard />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 ">
          <ClientCasesStatsCard />
        </div>
      </div>
    </div>
  );
};

export default LawyerStatistics;
