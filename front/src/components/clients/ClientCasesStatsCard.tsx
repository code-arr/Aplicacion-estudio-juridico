// src/components/clients/ClientCasesStatsCard.tsx
import React, { startTransition } from "react";
import {
  UserCircle2,
  FolderOpen,
  Timer,
  DollarSign,
  Scale,
} from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { useClientItemStore } from "@/store/useClientItemStore";
import type { Client } from "@/types/Client";
import type {
  CaseCycleRes,
  CaseCostRes,
  ClientAveragesRes,
  PracticeAreasRes,
} from "@/types/EntryDay";
import {
  getCaseCycle,
  getCaseCost,
  getClientAverages,
  getPracticeAreas,
} from "@/api/entryDay";
import { formatMoney } from "@/utils/money";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useSlidingUI } from "@/hooks/useSlidingUI";

function buildNameMaps(
  categories: { id: string; name: string }[] | undefined,
  sections: { id: string; name: string }[] | undefined,
  itemTypes: { id: string; name: string }[] | undefined
) {
  const cat = new Map<string, string>();
  const sec = new Map<string, string>();
  const it = new Map<string, string>();
  (categories ?? []).forEach((x) => cat.set(x.id, x.name));
  (sections ?? []).forEach((x) => sec.set(x.id, x.name));
  (itemTypes ?? []).forEach((x) => it.set(x.id, x.name));
  return { cat, sec, it };
}

type StatusLike = string | null | undefined;

const normalize = (s: StatusLike) =>
  (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const MAP_TW: Record<string, { label: string; cls: string }> = {
  open: { label: "Abierto", cls: "text-green-700 bg-green-100" },
  on_hold: { label: "En espera", cls: "text-yellow-700 bg-yellow-100" },
  closed: { label: "Cerrado", cls: "text-red-700 bg-red-100" },
};

function StatusBadge({ status }: { status: StatusLike }) {
  const key = normalize(status);
  const conf = MAP_TW[key];
  if (!conf) return <span>—</span>;
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${conf.cls}`}
    >
      {conf.label}
    </span>
  );
}

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

export default function ClientCasesStatsCard() {
  const sliding = useSlidingUI(240);

  const categories = useCatalogStore((s) => s.categories);
  const sections = useCatalogStore((s) => s.sections);
  const itemTypes = useCatalogStore((s) => s.itemTypes);

  const {
    cat: catMap,
    sec: secMap,
    it: itMap,
  } = React.useMemo(
    () => buildNameMaps(categories, sections, itemTypes),
    [categories, sections, itemTypes]
  );

  const categoryNamed = React.useCallback(
    (id?: string | null) => (id ? catMap.get(id) ?? null : null),
    [catMap]
  );
  const sectionNamed = React.useCallback(
    (id?: string | null) => (id ? secMap.get(id) ?? null : null),
    [secMap]
  );
  const itemTypeNamed = React.useCallback(
    (id?: string | null) => (id ? itMap.get(id) ?? null : null),
    [itMap]
  );

  const clients = useClientStore((s) => s.clientsByLawyer);
  const itemsByLawyer = useClientItemStore((s) => s.clientItems);

  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );

  // caches locales para evitar llamadas repetidas
  const [avg, setAvg] = React.useState<ClientAveragesRes | null>(null);
  const [areas, setAreas] = React.useState<PracticeAreasRes | null>(null);
  const [cycleByItem, setCycleByItem] = React.useState<
    Record<string, CaseCycleRes>
  >({});
  const [costByItem, setCostByItem] = React.useState<
    Record<string, CaseCostRes>
  >({});

  const clientOptions = React.useMemo(
    () => (clients ?? []).filter((c): c is Client & { id: string } => !!c.id),
    [clients]
  );

  const clientItems = React.useMemo(() => {
    if (!selectedClient?.id) return [];
    return (itemsByLawyer ?? []).filter(
      (it) => it.clientId === selectedClient.id
    );
  }, [selectedClient, itemsByLawyer]);

  React.useEffect(() => {
    if (!selectedClient && clientOptions.length) {
      setSelectedClient(clientOptions[0]);
    }
  }, [clientOptions, selectedClient]);

  React.useEffect(() => {
    const run = async () => {
      if (!selectedClient?.id) return;
      const [a, p] = await Promise.all([
        getClientAverages(selectedClient.id),
        getPracticeAreas(selectedClient.id, {
          level: "itemType",
          includeHours: true,
          includeCost: true,
        }),
      ]);
      // Commiteamos en transición para no impactar animación
      startTransition(() => {
        setAvg(a);
        setAreas(p);
      });
    };
    run();
  }, [selectedClient?.id]);

  // trae ciclo/costo sólo de los primeros 6 casos para no pegarle a todos a la vez
  React.useEffect(() => {
    const run = async () => {
      const first = clientItems.slice(0, 6);
      for (const it of first) {
        if (!it.id) continue;
        if (!cycleByItem[it.id]) {
          getCaseCycle(it.id).then((r) =>
            startTransition(() =>
              setCycleByItem((s) => ({ ...s, [it.id!]: r }))
            )
          );
        }
        if (!costByItem[it.id]) {
          getCaseCost(it.id).then((r) =>
            startTransition(() => setCostByItem((s) => ({ ...s, [it.id!]: r })))
          );
        }
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientItems.map((x) => x.id).join(",")]);

  return (
    <Card className={`p-5 ${sliding ? "shadow-none" : ""}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-5 h-5 text-blue-700" />
          <span className="text-lg font-semibold text-slate-900">
            Estadísticas por casos
          </span>
        </div>

        <select
          value={selectedClient?.id ?? ""}
          onChange={(e) => {
            const c =
              clientOptions.find((x) => x.id === e.target.value) ?? null;
            setSelectedClient(c);
            setAvg(null);
            setAreas(null);
            setCycleByItem({});
            setCostByItem({});
          }}
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
        >
          {clientOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.type === "Fisica"
                ? `${c.firstName} ${c.lastName}`
                : c.companyName}
            </option>
          ))}
        </select>
      </div>

      {/* KPIs promedio por cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi
          icon={<FolderOpen />}
          label="Casos (tot/ab/cerr)"
          value={
            avg
              ? `${avg.cases.total} / ${avg.cases.open} / ${avg.cases.closed}`
              : "—"
          }
        />
        <Kpi
          icon={<Timer />}
          label="Horas totales"
          value={avg ? `${avg.hours.total.toFixed(1)} hs` : "—"}
        />
        <Kpi
          icon={<Timer />}
          label="Prom. hs/caso"
          value={avg ? `${avg.hours.avgPerCase.toFixed(1)} hs` : "—"}
        />
        <Kpi
          icon={<DollarSign />}
          label="Prom. costo/caso"
          value={
            avg ? formatMoney(avg.cost.avgPerCase, avg.cost.currency) : "—"
          }
        />
        <Kpi
          icon={<Scale />}
          label="Prom. días a cierre"
          value={avg ? `${avg.timeToClose.avgDays}` : "—"}
        />
      </div>

      {/* Áreas de práctica */}
      <div className="mt-6">
        <h4 className="text-slate-900 font-semibold mb-2">
          Áreas de práctica (por tipo de caso)
        </h4>
        <div
          className="overflow-x-auto"
          style={{
            contain: "layout paint",
            pointerEvents: sliding ? "none" : "auto",
          }}
        >
          <table className="min-w-[600px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="text-left py-2 font-normal">Área</th>
                <th className="text-right py-2 font-normal">Casos</th>
                <th className="text-right py-2 font-normal">Horas</th>
                <th className="text-right py-2 font-normal">
                  Costo prom./caso
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(areas?.items ?? []).map((it) => (
                <tr key={it.name}>
                  <td className="py-2 text-slate-800">{it.name}</td>
                  <td className="py-2 text-right">{it.cases}</td>
                  <td className="py-2 text-right">
                    {it.hours?.toFixed(1) ?? "—"}
                  </td>
                  <td className="py-2 text-right">
                    {it.avgCostPerCase != null && it.cost
                      ? formatMoney(it.avgCostPerCase, it.cost.currency)
                      : "—"}
                  </td>
                </tr>
              ))}
              {!areas?.items?.length && (
                <tr>
                  <td colSpan={4} className="py-2 text-slate-500">
                    Sin datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista compacta de casos (primeros 6) */}
      <div className="mt-6">
        <h4 className="text-slate-900 font-semibold mb-2">
          Casos (estimación actual)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {clientItems.slice(0, 6).map((it) => {
            const cyc = it.id ? cycleByItem[it.id] : undefined;
            const cst = it.id ? costByItem[it.id] : undefined;
            const areaName =
              itemTypeNamed(it.itemTypeId) ??
              sectionNamed(it.sectionId) ??
              categoryNamed(it.categoryId) ??
              "—";
            return (
              <Card key={it.id} className={sliding ? "p-4 shadow-none" : "p-4"}>
                <div className="text-slate-900 font-medium">
                  {it.title ?? "(Sin título)"}
                </div>
                <div className="text-xs text-slate-500 mb-2">{areaName}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Row
                    label="Estado"
                    value={<StatusBadge status={cyc?.status} />}
                  />
                  <Row
                    label="Horas"
                    value={cst ? `${cst.time.totalHours.toFixed(1)} hs` : "—"}
                  />
                  <Row
                    label="Días abiertos"
                    value={cyc?.daysOpen ?? cyc?.daysToClose ?? "—"}
                  />
                  <Row
                    label="Costo estimado"
                    value={
                      cst ? formatMoney(cst.cost.raw, cst.cost.currency) : "—"
                    }
                  />
                </div>
              </Card>
            );
          })}
          {!clientItems.length && (
            <Card className="p-4">
              <div className="text-slate-500 text-sm">
                Este cliente no tiene casos.
              </div>
            </Card>
          )}
        </div>
      </div>
    </Card>
  );
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-600 text-sm">
        <span className="text-slate-700">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
    </Card>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-slate-500 text-xs">{label}</div>
      <div className="text-slate-900">{value}</div>
    </div>
  );
}
