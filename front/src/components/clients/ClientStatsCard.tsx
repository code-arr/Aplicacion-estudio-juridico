import React, { useEffect, useMemo, useState } from "react";
import type { Client } from "@/types/Client";
import { UserCircle2, ChevronDown } from "lucide-react";
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

// ====== Tipos ======
type CategoryRow = { label: string; hours: number };
type Point = { label: string; hours: number };
type RangeKey = "days" | "weeks" | "months";

export interface FixedStats {
  totalDay: number; // hoy
  totalWeek: number; // semana actual
  totalMonth: number; // mes actual
  avgWeek?: number; // opcional: si no viene se calcula = totalWeek / 7
  avgMonth?: number; // opcional: si no viene se calcula = totalMonth / daysInMonth
}

export interface ClientStatsCardProps {
  clientName?: string;
  // Lista superior por categorías (hoy)
  categories?: CategoryRow[];
  // Series para el gráfico (7 puntos cada una)
  series?: {
    days: Point[];
    weeks: Point[];
    months: Point[];
  };
  fixedStats?: FixedStats; // <— NUEVO
}

// ====== Helpers ======
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

// ====== Demo por defecto ======
const demoCategories: CategoryRow[] = [
  { label: "Documents", hours: 5.0 },
  { label: "Audiences", hours: 2.0 },
  { label: "Meetings", hours: 3.0 },
  { label: "Processes", hours: 2.0 },
  { label: "Extra", hours: 3.0 },
];

const demoSeries = {
  days: [
    { label: "Lun", hours: 2.1 },
    { label: "Mar", hours: 3.4 },
    { label: "Mié", hours: 2.0 },
    { label: "Jue", hours: 3.6 },
    { label: "Vie", hours: 2.2 },
    { label: "Sáb", hours: 4.0 },
    { label: "Dom", hours: 4.5 },
  ],
  weeks: [
    { label: "Sem 1", hours: 18.2 },
    { label: "Sem 2", hours: 21.3 },
    { label: "Sem 3", hours: 19.7 },
    { label: "Sem 4", hours: 22.8 },
    { label: "Sem 5", hours: 20.4 },
    { label: "Sem 6", hours: 23.9 },
    { label: "Sem 7", hours: 24.6 },
  ],
  months: [
    { label: "Ene", hours: 72.1 },
    { label: "Feb", hours: 80.3 },
    { label: "Mar", hours: 91.4 },
    { label: "Abr", hours: 84.2 },
    { label: "May", hours: 95.8 },
    { label: "Jun", hours: 98.9 },
    { label: "Jul", hours: 101.2 },
  ],
};

// ====== Componente ======
export default function ClientStatsCard({
  categories = demoCategories,
  series = demoSeries,
  fixedStats, // <— NUEVO
}: ClientStatsCardProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>();
  const [range, setRange] = useState<RangeKey>("days");
  const [resizeKey, setResizeKey] = useState(0);
  const data = series[range];

  const clients = useClientStore((s) => s.clientsByLawyer);

  const defaultClient = useMemo(() => {
    if (!clients || clients.length === 0) return;
    else return clients[0];
  }, [clients]);

  const handleSelectedClient = (clientId: string) => {
    const c = clients?.find((c) => c.id === clientId) ?? null;
    setSelectedClient(c);
  };

  useEffect(() => {
    if (defaultClient) setSelectedClient(defaultClient);
  }, [defaultClient]);

  useEffect(() => {
    const handler = () => setResizeKey((k) => k + 1);
    window.addEventListener("sidebar:transition-end", handler);
    return () => window.removeEventListener("sidebar:transition-end", handler);
  }, []);

  const chartMargin = useMemo(
    () => ({ left: 8, right: 8, top: 8, bottom: 4 }),
    []
  );

  // === KPIs fijos (no dependen del gráfico) ===
  const stats = React.useMemo(() => {
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

    // fallback DEMO si no pasás fixedStats (para que veas algo en pantalla)
    const demoToday = series.days.at(-1)?.hours ?? 0; // último punto ~ hoy
    const demoWeekTotal = series.weeks.at(-1)?.hours ?? 0; // última semana
    const demoMonthTotal = series.months.at(-1)?.hours ?? 0; // último mes
    const dpm = daysInMonth();

    return {
      totalDay: demoToday,
      totalWeek: demoWeekTotal,
      totalMonth: demoMonthTotal,
      avgWeek: demoWeekTotal / 7,
      avgMonth: demoMonthTotal / dpm,
    };
  }, [fixedStats, series]);

  // KPIs (simple y claro)
  const { total, avg } = useMemo(() => {
    const t = data.reduce((acc, p) => acc + p.hours, 0);
    const a = t / (data.length || 1);
    return { total: t, avg: a };
  }, [data]);

  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm p-5">
      {/* Header con “searchbar” clickable (dummy) */}
      <Select value={selectedClient?.id} onValueChange={handleSelectedClient}>
        {/* <div className="flex items-center gap-2 mb-3 py-1 px-2 border border-slate-200 rounded-lg shadow-xs cursor-pointer"> */}
        <SelectTrigger className="flex items-center gap-2 mb-2 py-1 px-2 border border-slate-200 rounded-lg shadow-xs cursor-pointer">
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-blue-700" />
            <span className="text-lg font-semibold text-slate-900">
              {selectedClient
                ? selectedClient.type === "Fisica"
                  ? `${selectedClient.firstName}  ${selectedClient?.lastName}`
                  : selectedClient.companyName
                : "Seleccionar cliente"}
            </span>
          </div>
          {/* <ChevronDown className="ml-auto w-4 h-4 text-slate-500" /> */}
        </SelectTrigger>
        {/* </div> */}
        <SelectContent>
          {clients?.map((c) => (
            <SelectItem value={c.id}>
              {c.type === "Fisica"
                ? `${c.firstName}  ${c.lastName}`
                : c.companyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-[40%_auto] gap-x-6 items-center">
        {/* Lista por categorías (hoy) */}
        <div>
          <p className="text-sm text-slate-500 mb-3">
            Elementos trabajados el día: hoy
          </p>
          <div className="space-y-3 divide-y divide-slate-100">
            {categories.map((c) => (
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
            style={{ isolation: "isolate", contain: "layout paint" }} // opcional pero recomendado
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

      {/* KPIs debajo del gráfico — FIJOS, no dependen del tab/gráfico */}
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
              Total horas x semana ()
            </div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.totalWeek, 1)}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-slate-600 text-sm">Total hs x mes</div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.totalMonth, 1)}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-slate-600 text-sm">Promedio hs semanal</div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.avgWeek, 1)}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-slate-600 text-sm">Promedio hs mensual</div>
            <div className="text-2xl font-semibold text-slate-900">
              {fmtH(stats.avgMonth, 1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
