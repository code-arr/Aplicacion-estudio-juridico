// src/components/clients/ClientStatsCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Client } from "@/types/Client";
import { UserCircle2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useClientStore } from "@/store/useClientStore";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
} from "@/components/ui/select";
import { useStatsStore } from "@/store/useStatsStore";
import {
  mapDaysToSeries,
  mapWeeksToSeries,
  mapMonthlyToSeries,
  categoriesFromMonthByType,
  currentMonthNumber,
  secToHours,
} from "@/utils/timeMaps";
import type { CostSummary } from "@/types/EntryDay";
import { getCostSummary } from "@/api/entryDay";

// ====== Tipos locales (UI) ======
type CategoryRow = { label: string; hours: number };
type Point = { label: string; hours: number };
type RangeKey = "days" | "weeks" | "months";

export interface FixedStats {
  totalDay: number;
  totalWeek: number;
  totalMonth: number;
  avgWeek?: number;
  avgMonth?: number;
}

export interface ClientStatsCardProps {
  categories?: CategoryRow[];
  series?: {
    days: Point[];
    weeks: Point[];
    months: Point[];
  };
  fixedStats?: FixedStats;
}

// ====== Helpers locales ======
function startOfIsoWeek(d = new Date()): Date {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // lun=1 … dom=7
  date.setUTCDate(date.getUTCDate() - (day - 1)); // ir al lunes
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function endOfIsoWeek(d = new Date()): Date {
  const start = startOfIsoWeek(d);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6); // domingo
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

// Suma segundos de totalByDay dentro de una semana ISO (l→d)
function sumWeekFromDays(
  totalByDay: Record<string, number>,
  baseDate = new Date()
): number {
  const start = startOfIsoWeek(baseDate);
  const end = endOfIsoWeek(baseDate);

  let acc = 0;
  for (const iso of Object.keys(totalByDay)) {
    // iso viene "YYYY-MM-DD"
    const d = new Date(`${iso}T00:00:00Z`);
    if (d >= start && d <= end) acc += totalByDay[iso] || 0;
  }
  return acc; // en segundos
}

const daysInMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

const fmtH = (n: number, d = 1) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n) + "hs";

const Tab = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={[
      "px-3 py-1 rounded-lg text-sm",
      active
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100",
    ].join(" ")}
  >
    {children}
  </button>
);

// ====== Demo de respaldo ======
const demoCategories: CategoryRow[] = [
  { label: "Documents", hours: 0 },
  { label: "Audiences", hours: 0 },
  { label: "Meetings", hours: 0 },
  { label: "Process", hours: 0 },
  { label: "Client", hours: 0 },
];

const demoSeries = {
  days: [
    { label: "Lun", hours: 0 },
    { label: "Mar", hours: 0 },
    { label: "Mié", hours: 0 },
    { label: "Jue", hours: 0 },
    { label: "Vie", hours: 0 },
    { label: "Sáb", hours: 0 },
    { label: "Dom", hours: 0 },
  ],
  weeks: [
    { label: "Sem 1", hours: 0 },
    { label: "Sem 2", hours: 0 },
    { label: "Sem 3", hours: 0 },
    { label: "Sem 4", hours: 0 },
    { label: "Sem 5", hours: 0 },
    { label: "Sem 6", hours: 0 },
    { label: "Sem 7", hours: 0 },
  ],
  months: [
    { label: "Ene", hours: 0 },
    { label: "Feb", hours: 0 },
    { label: "Mar", hours: 0 },
    { label: "Abr", hours: 0 },
    { label: "May", hours: 0 },
    { label: "Jun", hours: 0 },
    { label: "Jul", hours: 0 },
  ],
};

// ====== Componente ======
export default function ClientStatsCard({
  categories: categoriesProp,
  series: seriesProp,
  fixedStats,
}: ClientStatsCardProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [range, setRange] = useState<RangeKey>("days");
  const [resizeKey, setResizeKey] = useState(0);
  const [cost, setCost] = React.useState<CostSummary | null>(null);

  const { clientDetails, fetchClientDetail, isLoading, error } =
    useStatsStore();
  const clients = useClientStore((s) => s.clientsByLawyer);

  const defaultClient = useMemo(() => {
    if (!clients || clients.length === 0) return null;
    return clients.find((c) => !!c.id) ?? clients[0]; // FIX: elegimos uno que tenga id
  }, [clients]);

  const handleSelectedClient = (clientId: string) => {
    // FIX: clientId siempre string; buscamos y si existe pedimos el detail
    const c = clients?.find((x) => x.id === clientId) ?? null;
    setSelectedClient(c);
    if (c?.id) fetchClientDetail(c.id);
  };

  useEffect(() => {
    if (defaultClient) {
      setSelectedClient(defaultClient);
      if (defaultClient.id) fetchClientDetail(defaultClient.id); // FIX: guard clause por id
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultClient]);

  useEffect(() => {
    const handler = () => setResizeKey((k) => k + 1);
    window.addEventListener("sidebar:transition-end", handler);
    return () => window.removeEventListener("sidebar:transition-end", handler);
  }, []);

  // FIX: scId nunca es undefined cuando lo usamos para indexar
  const scId: string | null = selectedClient?.id ?? null;

  const detail = scId ? clientDetails[scId] : undefined;

  useEffect(() => {
    async function loadCost() {
      if (!selectedClient?.id) return;
      // mes actual por default
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const data = await getCostSummary({
        clientId: selectedClient.id,
        year,
        month,
      });
      setCost(data);
    }
    loadCost();
  }, [selectedClient?.id]);

  const categories: CategoryRow[] = useMemo(() => {
    if (categoriesProp) return categoriesProp;
    if (!detail) return demoCategories;
    return categoriesFromMonthByType(detail.totalByMonthByType);
  }, [categoriesProp, detail]);

  const series = useMemo(() => {
    if (seriesProp) return seriesProp;
    if (!detail) return demoSeries;

    return {
      days: mapDaysToSeries(detail.totalByDay, {
        mode: "rolling7",
        onlyWeekDays: true, // ← excluye sábados y domingos
      }),
      weeks: mapWeeksToSeries(detail.totalByWeek),
      months: mapMonthlyToSeries(detail.totalByMonth, 12),
    };
  }, [seriesProp, detail]);

  // === KPIs fijos (hoy/semana/mes) derivados del detail ===
  const stats = useMemo(() => {
    if (fixedStats) {
      const dpm = daysInMonth();
      return {
        totalDay: fixedStats.totalDay,
        totalWeek: fixedStats.totalWeek,
        totalMonth: fixedStats.totalMonth,
        avgWeek: fixedStats.avgWeek ?? fixedStats.totalWeek / 7,
        avgMonth: fixedStats.avgMonth ?? fixedStats.totalMonth / dpm,
      };
    }
    if (!detail) {
      const dpm = daysInMonth();
      const lastDay = demoSeries.days.at(-1)?.hours ?? 0;
      const lastWeek = demoSeries.weeks.at(-1)?.hours ?? 0;
      const lastMonth = demoSeries.months.at(-1)?.hours ?? 0;
      return {
        totalDay: lastDay,
        totalWeek: lastWeek,
        totalMonth: lastMonth,
        avgWeek: lastWeek / 7,
        avgMonth: lastMonth / dpm,
      };
    }

    const todayIso = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const totalDay = secToHours(detail.totalByDay[todayIso] ?? 0);

    /* const weekNumber = getIsoWeekNumber(new Date());
    const totalWeek = secToHours(detail.totalByWeek[weekNumber] ?? 0); */

    const weekNumber = getIsoWeekNumber(new Date());

    // 1) intento usar el mapa que viene del back
    let totalWeekSec = detail.totalByWeek[weekNumber];

    // 2) fallback: si no está esa key, sumo la semana a partir de totalByDay (l→d)
    if (totalWeekSec == null) {
      totalWeekSec = sumWeekFromDays(detail.totalByDay, new Date());
    }

    const totalWeek = secToHours(totalWeekSec ?? 0);

    const month = currentMonthNumber();
    const totalMonth = secToHours(detail.totalByMonth[month] ?? 0);

    const dpm = daysInMonth();
    return {
      totalDay,
      totalWeek,
      totalMonth,
      avgWeek: totalWeek / 7,
      avgMonth: totalMonth / dpm,
    };
  }, [fixedStats, detail]);

  const data = series[range];

  const chartMargin = useMemo(
    () => ({ left: 8, right: 8, top: 8, bottom: 4 }),
    []
  );

  // Helpers para estados por cliente (evitan index con undefined)
  const isLoadingDetail = scId ? !!isLoading.clientDetail[scId] : false; // FIX
  const errorDetail = scId ? error.clientDetail[scId] : undefined; // FIX

  const ORDER = [
    "Documents",
    "Audiences",
    "Meetings",
    "Processes",
    "Client",
  ] as const;
  const LABELS_ES: Record<(typeof ORDER)[number], string> = {
    Documents: "Documentos",
    Audiences: "Audiencias",
    Meetings: "Reuniones",
    Processes: "Trámites", // 👈 singular en key, texto libre en español
    Client: "Extra",
  };

  const categoriesEs = React.useMemo(() => {
    const map = new Map<string, number>(
      categories.map((c) => [c.label, c.hours])
    );
    return ORDER.map((key) => ({
      label: LABELS_ES[key],
      hours: map.get(key) ?? 0, // si no vino, mostramos 0
    }));
  }, [categories]);

  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm p-5">
      {/* Header con selector de cliente */}
      <Select
        // FIX: nunca undefined (Select espera string)
        value={scId ?? ""}
        onValueChange={handleSelectedClient}
      >
        <SelectTrigger className="flex items-center gap-2 mb-2 py-1 px-2 border border-slate-200 rounded-lg shadow-xs cursor-pointer">
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-blue-700" />
            <span className="text-lg font-semibold text-slate-900">
              {selectedClient
                ? selectedClient.type === "Fisica"
                  ? `${selectedClient.firstName} ${selectedClient.lastName}`
                  : selectedClient.companyName
                : "Seleccionar cliente"}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {(clients ?? [])
            .filter((c): c is Client & { id: string } => !!c.id) // FIX: filtramos sin id
            .map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.type === "Fisica"
                  ? `${c.firstName} ${c.lastName}`
                  : c.companyName}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-[40%_auto] gap-x-6 items-center">
        {/* Categorías del mes actual */}
        <div>
          <p className="text-sm text-slate-500 mb-3">
            Elementos trabajados (mes actual)
          </p>
          <div className="space-y-3 divide-y divide-slate-100">
            {categoriesEs.map((c) => (
              <div
                key={c.label}
                className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm pt-2 first:pt-0"
              >
                <span className="text-slate-700">{c.label}</span>
                <span className="font-medium text-slate-900">
                  {fmtH(c.hours, 1)}
                </span>
              </div>
            ))}
            {!categories.length && (
              <div className="text-sm text-slate-500 pt-2">
                {scId
                  ? isLoadingDetail
                    ? "Cargando..."
                    : errorDetail || "Sin datos"
                  : "Seleccioná un cliente"}
              </div>
            )}
          </div>
        </div>

        {/* Tabs + Gráfico */}
        <div className="mt-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Tab active={range === "days"} onClick={() => setRange("days")}>
              Días
            </Tab>
            <Tab active={range === "weeks"} onClick={() => setRange("weeks")}>
              Semanas
            </Tab>
            <Tab active={range === "months"} onClick={() => setRange("months")}>
              Meses
            </Tab>
          </div>

          <div
            className="h-56 w-full rounded-lg border border-slate-100 bg-slate-50/40 p-2"
            style={{ isolation: "isolate", contain: "layout paint" }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              debounce={150}
              key={resizeKey}
            >
              <LineChart data={data} margin={chartMargin}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={40}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => fmtH(v as number)}
                  labelStyle={{ color: "#0f172a" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#1e40af"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                  fillOpacity={0.15}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPIs debajo del gráfico — fijos */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-slate-600 text-sm">
              Total horas x día (hoy)
            </div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.totalDay, 1)}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-slate-600 text-sm">
              Total horas x semana (ISO)
            </div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.totalWeek, 1)}
            </div>
          </div>

          {/* <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-slate-600 text-sm">Total hs x mes</div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.totalMonth, 1)}
            </div>
          </div> */}
        </div>
        <div className="space-y-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-slate-600 text-sm">Promedio hs semanal</div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.avgWeek ?? 0, 1)}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-slate-600 text-sm">Promedio hs mensual</div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.avgMonth ?? 0, 1)}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-slate-600 text-sm">Tarifa por hora</div>
          <div className="text-2xl font-semibold text-slate-900">
            {cost ? cost.formatted.hourlyRate : "—"}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-slate-600 text-sm">Horas (mes)</div>
          <div className="text-2xl font-semibold text-slate-900">
            {cost ? `${cost.time.totalHours.toFixed(1)}hs` : "—"}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-slate-600 text-sm">Costo (mes)</div>
          <div className="text-2xl font-semibold text-slate-900">
            {cost ? cost.formatted.totalCost : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Helper ISO week =====
function getIsoWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
