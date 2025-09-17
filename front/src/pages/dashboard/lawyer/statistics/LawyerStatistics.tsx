import React from "react";
import {
  useClientStore,
  selectClientsByLawyer,
  selectIsLoadingClients,
} from "@/store/useClientStore";
/* import { Card } from "@components/ui/card"; */
import Avatar from "@/assets/usuario.png";
import { FolderClosed } from "lucide-react";
import ClientStatsCard from "./ClientStatsCard";

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
const clamp = (n: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, n));
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

function ProgressBar({
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
}

// =============================
// Demo data (se usa si no pasás props)
// =============================
const demo = {
  kpis: {
    activeItems: 15,
    billableHoursThisMonth: 126.4,
    collectionRate: null, // N/A
    avgResolutionDays: 34,
  } satisfies LawyerKpis,
  hoursByWeek: [
    { label: "Sem 17", hours: 14.5 },
    { label: "Sem 16", hours: 14.0 },
    { label: "Sem 15", hours: 13.6 },
    { label: "Sem 14", hours: 11.2 },
    { label: "Sem 13", hours: 10.3 },
    { label: "Sem 12", hours: 9.8 },
    /* { label: "Sem 11", hours: 9.1 }, */
    /*   { label: "Sem 10", hours: 11.2 }, */
  ] as WeekHours[],
  casesByStage: [
    { stage: "Documents", count: 5 },
    { stage: "Audiences", count: 2 },
    { stage: "Meetings", count: 3 },
    { stage: "Processes", count: 2 },
    { stage: "Extra", count: 3 },
  ] as StageCount[],
  topClients: [
    { name: "Cliente A", hours: 19.8 },
    { name: "Cliente B", hours: 13.4 },
    { name: "Cliente C", hours: 12.2 },
    { name: "Cliente D", hours: 11.9 },
    { name: "Cliente E", hours: 11.0 },
  ] as TopClient[],
};

// =============================
// Main component
// =============================
const LawyerStatistics = ({
  kpis = demo.kpis,
  hoursByWeek = demo.hoursByWeek,
  casesByStage = demo.casesByStage,
  topClients = demo.topClients,
  className = "",
}: LawyerStatisticsProps) => {
  return (
    <div className="bg-gradient-to-t from-[#334155] via-[#3b4d66] to-[#60a5fa]/20 min-h-screen">
      <div className={`w-full p-4 lg:p-6 ${className}`}>
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Item activos" value={kpis.activeItems} />
          <StatCard
            label="Horas (mes at.)"
            value={formatNumber(kpis.billableHoursThisMonth)}
            hint="% mes actual"
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
              Horas por semana
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-[480px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pt-1 pb-3 font-normal">Semana</th>
                    <th className="pt-1 pb-3 font-normal text-right">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hoursByWeek.map((w) => (
                    <tr key={w.label}>
                      <td className="py-2 text-slate-800">{w.label}</td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        {`${formatNumber(w.hours)}hs`}
                      </td>
                    </tr>
                  ))}
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
                  {topClients.map((c) => (
                    <tr key={c.name}>
                      <td className="py-2 text-slate-800">{c.name}</td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        {`${formatNumber(c.hours)}hs`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Tiempo por cliente */}
        <div className="mt-4 grid grid-cols-1 gap-4 ">
          <ClientStatsCard />
        </div>
      </div>
    </div>
  );
};

export default LawyerStatistics;
