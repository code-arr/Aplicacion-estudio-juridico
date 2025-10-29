// src/pages/dashboard/admin/AdminStatsPage.tsx
import React, { useEffect, useMemo, useState, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/utils/money";

import {
  getStudyAverages,
  getClientAverages,
  getPracticeAreas,
  getCaseCycle,
  getCaseCost,
} from "@/api/entryDay";
import { getAllLawyers } from "@/api/lawyer";
import { getAllClients } from "@/api/client";
import { getAllClientItems } from "@/api/clientItem";

import type {
  StudyAveragesRes,
  ClientAveragesRes,
  PracticeAreasRes,
  CaseCycleRes,
  CaseCostRes,
} from "@/types/EntryDay";
import type { Lawyer } from "@/types/Lawyer";
import type { Client } from "@/types/Client";
import type { ClientItem } from "@/types/ClientItem";

// =============== UI Atoms ===============
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
function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-600">
        {label}
        {hint ? <span className="text-slate-400"> · {hint}</span> : null}
      </div>
    </Card>
  );
}
function SectionTitle({ children }: React.PropsWithChildren) {
  return (
    <h3 className="mb-3 text-lg font-semibold text-slate-900">{children}</h3>
  );
}

// =============== Helpers ===============
const fmt = (n: number, d = 1) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);

const displayClientName = (c: Client) =>
  c.companyName ?? ([c.firstName, c.lastName].filter(Boolean).join(" ") || "—");

type Scope = "studio" | "lawyer" | "client" | "item";

// =============== Main ===============
export default function AdminStatsPage() {
  const [scope, setScope] = useState<Scope>("studio");
  const [year, setYear] = useState<string>(""); // vacío = año actual

  // Lawyers
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [lawyerId, setLawyerId] = useState<string>("");
  // Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [qClient, setQClient] = useState("");
  // Items
  const [items, setItems] = useState<ClientItem[]>([]);
  const [clientItemId, setClientItemId] = useState<string>("");
  const [qItem, setQItem] = useState("");

  // Data
  const [studio, setStudio] = useState<StudyAveragesRes | null>(null);
  const [lawyerAvg, setLawyerAvg] = useState<StudyAveragesRes | null>(null);
  const [clientAvg, setClientAvg] = useState<ClientAveragesRes | null>(null);
  const [areas, setAreas] = useState<PracticeAreasRes | null>(null);
  const [itemCycle, setItemCycle] = useState<CaseCycleRes | null>(null);
  const [itemCost, setItemCost] = useState<CaseCostRes | null>(null);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pagination “Ver más”
  const STEP = 15;
  const [pageAreas, setPageAreas] = useState(STEP);
  const [pageLawyers, setPageLawyers] = useState(30);
  const [pageClients, setPageClients] = useState(30);
  const [pageItems, setPageItems] = useState(30);

  // Bootstrap lists (lawyers/clients/items) una sola vez
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ls, cs, is] = await Promise.all([
          getAllLawyers().catch(() => []),
          getAllClients().catch(() => []),
          getAllClientItems().catch(() => []),
        ]);
        if (!alive) return;
        setLawyers(ls || []);
        setClients(cs || []);
        setItems(is || []);
      } catch {
        /* mute */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Reset de páginas al cambiar filtros
  useEffect(() => setPageAreas(STEP), [clientId, year, scope]);
  useEffect(() => setPageLawyers(30), [qClient]);
  useEffect(() => setPageClients(30), [qClient]);
  useEffect(() => setPageItems(30), [qItem]);

  // Fetch según scope
  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const yNum = year ? Number(year) : undefined;

        if (scope === "studio") {
          const data = await getStudyAverages(
            yNum ? { year: yNum } : undefined
          );
          if (!alive) return;
          startTransition(() => setStudio(data));
        }

        if (scope === "lawyer") {
          if (!lawyerId) {
            startTransition(() => setLawyerAvg(null));
          } else {
            const data = await getStudyAverages({ year: yNum, lawyerId });
            if (!alive) return;
            startTransition(() => setLawyerAvg(data));
          }
        }

        if (scope === "client") {
          if (!clientId) {
            startTransition(() => {
              setClientAvg(null);
              setAreas(null);
            });
          } else {
            const [a, p] = await Promise.all([
              getClientAverages(clientId, yNum ? { year: yNum } : undefined),
              getPracticeAreas(clientId, {
                level: "itemType",
                includeHours: true,
                includeCost: true,
                year: yNum,
              }),
            ]);
            if (!alive) return;
            startTransition(() => {
              setClientAvg(a);
              setAreas(p);
            });
          }
        }

        if (scope === "item") {
          if (!clientItemId) {
            startTransition(() => {
              setItemCycle(null);
              setItemCost(null);
            });
          } else {
            const [cyc, cst] = await Promise.all([
              getCaseCycle(clientItemId),
              getCaseCost(clientItemId),
            ]);
            if (!alive) return;
            startTransition(() => {
              setItemCycle(cyc);
              setItemCost(cst);
            });
          }
        }
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar estadísticas");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [scope, lawyerId, clientId, clientItemId, year]);

  // === Filters / Lists ===
  const filteredClients = useMemo(() => {
    const s = qClient.trim().toLowerCase();
    const arr = clients.map((c) => ({ c, label: displayClientName(c) }));
    if (!s) return arr;
    return arr.filter(({ label, c }) =>
      [label, c.rut, c.email, c.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [clients, qClient]);

  const filteredItems = useMemo(() => {
    const s = qItem.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) =>
      [
        it.title,
        it.status,
        it.clientId,
        it.categoryId,
        it.sectionId,
        it.itemTypeId,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [items, qItem]);

  // ======= UI =======
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">
            Estadísticas
          </h1>
          <p className="text-sm text-[#6b7280]">
            Vista global del estudio y análisis por abogado, cliente e item.
          </p>
        </div>

        {/* Scope Switch */}
        <div className="flex gap-2">
          {(
            [
              { key: "studio", label: "Estudio" },
              { key: "lawyer", label: "Abogado" },
              { key: "client", label: "Cliente" },
              { key: "item", label: "Item" },
            ] as { key: Scope; label: string }[]
          ).map((t) => (
            <Button
              key={t.key}
              variant={scope === t.key ? "default" : "outline"}
              onClick={() => setScope(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filtros generales */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Año */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Año</span>
            <Input
              placeholder="YYYY"
              className="w-28"
              value={year}
              onChange={(e) =>
                setYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))
              }
            />
          </div>

          {/* Abogado */}
          {scope === "lawyer" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Abogado</span>
              <Select value={lawyerId} onValueChange={setLawyerId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleccionar abogado" />
                </SelectTrigger>
                <SelectContent>
                  {lawyers.slice(0, pageLawyers).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {[l.firstName, l.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lawyers.length > pageLawyers && (
                <Button
                  variant="outline"
                  onClick={() => setPageLawyers((s) => s + 30)}
                >
                  Ver más
                </Button>
              )}
            </div>
          )}

          {/* Cliente */}
          {scope === "client" && (
            <>
              <Input
                className="w-64"
                placeholder="Buscar cliente…"
                value={qClient}
                onChange={(e) => setQClient(e.target.value)}
              />
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.slice(0, pageClients).map(({ c, label }) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredClients.length > pageClients && (
                <Button
                  variant="outline"
                  onClick={() => setPageClients((s) => s + 30)}
                >
                  Ver más
                </Button>
              )}
            </>
          )}

          {/* Item */}
          {scope === "item" && (
            <>
              <Input
                className="w-64"
                placeholder="Buscar item…"
                value={qItem}
                onChange={(e) => setQItem(e.target.value)}
              />
              <Select value={clientItemId} onValueChange={setClientItemId}>
                <SelectTrigger className="w-[28rem]">
                  <SelectValue placeholder="Seleccionar item" />
                </SelectTrigger>
                <SelectContent>
                  {filteredItems.slice(0, pageItems).map((it) => (
                    <SelectItem key={it.id} value={it.id!}>
                      {it.title ?? "(Sin título)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredItems.length > pageItems && (
                <Button
                  variant="outline"
                  onClick={() => setPageItems((s) => s + 30)}
                >
                  Ver más
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      {loading && <div className="text-sm text-slate-500">Cargando…</div>}
      {err && <div className="text-sm text-red-700">{err}</div>}

      {/* ======== STUDIO ======== */}
      {scope === "studio" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              label="Clientes"
              value={studio?.totals.clients ?? "—"}
              hint={studio?.year ? `año ${studio.year}` : "año actual"}
            />
            <Kpi
              label="Casos"
              value={studio?.totals.cases ?? "—"}
              hint={studio?.scope === "studio" ? "estudio" : undefined}
            />
            <Kpi
              label="Horas totales"
              value={studio ? `${fmt(studio.totals.hours, 1)} hs` : "—"}
              hint="año"
            />
            <Kpi
              label="Costo total"
              value={
                studio && studio.totals.cost.currency != null
                  ? formatMoney(
                      studio.totals.cost.raw,
                      studio.totals.cost.currency
                    )
                  : "—"
              }
              hint="año"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Kpi
              label="Prom. costo / cliente"
              value={
                studio && studio.averages.costPerClient.currency != null
                  ? formatMoney(
                      studio.averages.costPerClient.raw,
                      studio.averages.costPerClient.currency
                    )
                  : "—"
              }
            />
            <Kpi
              label="Prom. costo / caso"
              value={
                studio && studio.averages.costPerCase.currency != null
                  ? formatMoney(
                      studio.averages.costPerCase.raw,
                      studio.averages.costPerCase.currency
                    )
                  : "—"
              }
            />
            <Kpi
              label="Prom. días a cierre"
              value={studio ? `${studio.averages.resolutionDaysAvg ?? 0}` : "—"}
            />
          </div>
        </>
      )}

      {/* ======== LAWYER ======== */}
      {scope === "lawyer" && (
        <>
          {!lawyerId ? (
            <Card className="p-4 text-sm text-slate-600">
              Seleccioná un abogado para ver sus estadísticas.
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Kpi
                  label="Clientes"
                  value={lawyerAvg?.totals.clients ?? "—"}
                />
                <Kpi label="Casos" value={lawyerAvg?.totals.cases ?? "—"} />
                <Kpi
                  label="Horas totales"
                  value={
                    lawyerAvg ? `${fmt(lawyerAvg.totals.hours, 1)} hs` : "—"
                  }
                  hint={
                    lawyerAvg?.year ? `año ${lawyerAvg.year}` : "año actual"
                  }
                />
                <Kpi
                  label="Costo total"
                  value={
                    lawyerAvg && lawyerAvg.totals.cost.currency != null
                      ? formatMoney(
                          lawyerAvg.totals.cost.raw,
                          lawyerAvg.totals.cost.currency
                        )
                      : "—"
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Kpi
                  label="Prom. costo / cliente"
                  value={
                    lawyerAvg &&
                    lawyerAvg.averages.costPerClient.currency != null
                      ? formatMoney(
                          lawyerAvg.averages.costPerClient.raw,
                          lawyerAvg.averages.costPerClient.currency
                        )
                      : "—"
                  }
                />
                <Kpi
                  label="Prom. costo / caso"
                  value={
                    lawyerAvg && lawyerAvg.averages.costPerCase.currency != null
                      ? formatMoney(
                          lawyerAvg.averages.costPerCase.raw,
                          lawyerAvg.averages.costPerCase.currency
                        )
                      : "—"
                  }
                />
                <Kpi
                  label="Prom. días a cierre"
                  value={
                    lawyerAvg
                      ? `${lawyerAvg.averages.resolutionDaysAvg ?? 0}`
                      : "—"
                  }
                />
              </div>
            </>
          )}
        </>
      )}

      {/* ======== CLIENT ======== */}
      {scope === "client" && (
        <>
          {!clientId ? (
            <Card className="p-4 text-sm text-slate-600">
              Seleccioná un cliente para ver sus promedios y áreas.
            </Card>
          ) : (
            <>
              <SectionTitle>Promedios del cliente</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <Kpi
                  label="Casos (tot/ab/cerr)"
                  value={
                    clientAvg
                      ? `${clientAvg.cases.total} / ${clientAvg.cases.open} / ${clientAvg.cases.closed}`
                      : "—"
                  }
                />
                <Kpi
                  label="Horas totales"
                  value={
                    clientAvg ? `${clientAvg.hours.total.toFixed(1)} hs` : "—"
                  }
                />
                <Kpi
                  label="Prom. hs/caso"
                  value={
                    clientAvg
                      ? `${clientAvg.hours.avgPerCase.toFixed(1)} hs`
                      : "—"
                  }
                />
                <Kpi
                  label="Prom. costo/caso"
                  value={
                    clientAvg
                      ? formatMoney(
                          clientAvg.cost.avgPerCase,
                          clientAvg.cost.currency
                        )
                      : "—"
                  }
                />
                <Kpi
                  label="Prom. días a cierre"
                  value={clientAvg ? `${clientAvg.timeToClose.avgDays}` : "—"}
                />
              </div>

              <SectionTitle className="mt-5">
                Áreas de práctica (por tipo de caso)
              </SectionTitle>
              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-[640px] w-full text-sm">
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
                      {(areas?.items ?? []).slice(0, pageAreas).map((it) => (
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

                {areas?.items && areas.items.length > pageAreas && (
                  <div className="flex justify-center mt-3">
                    <Button
                      variant="outline"
                      onClick={() => setPageAreas((s) => s + STEP)}
                    >
                      Ver más
                    </Button>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* ======== ITEM ======== */}
      {scope === "item" && (
        <>
          {!clientItemId ? (
            <Card className="p-4 text-sm text-slate-600">
              Seleccioná un item/caso para ver ciclo y costo.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="p-4">
                <SectionTitle>Ciclo del caso</SectionTitle>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Row label="Estado" value={itemCycle?.status ?? "—"} />
                  <Row
                    label="Creado"
                    value={
                      itemCycle?.createdAt
                        ? new Date(itemCycle.createdAt).toLocaleDateString(
                            "es-AR"
                          )
                        : "—"
                    }
                  />
                  <Row
                    label="Cerrado"
                    value={
                      itemCycle?.closedAt
                        ? new Date(itemCycle.closedAt).toLocaleDateString(
                            "es-AR"
                          )
                        : "—"
                    }
                  />
                  <Row
                    label="Días abiertos"
                    value={itemCycle?.daysOpen ?? itemCycle?.daysToClose ?? "—"}
                  />
                  <Row
                    label="Horas trabajadas"
                    value={
                      itemCycle
                        ? `${itemCycle.worked.totalHours.toFixed(1)} hs`
                        : "—"
                    }
                  />
                </div>
              </Card>

              <Card className="p-4">
                <SectionTitle>Costo estimado</SectionTitle>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Row
                    label="Tarifa por hora"
                    value={
                      itemCost
                        ? formatMoney(
                            itemCost.pricing.hourlyRate,
                            itemCost.pricing.currency
                          )
                        : "—"
                    }
                  />
                  <Row
                    label="Horas"
                    value={
                      itemCost
                        ? `${itemCost.time.totalHours.toFixed(1)} hs`
                        : "—"
                    }
                  />
                  <Row
                    label="Costo"
                    value={
                      itemCost
                        ? formatMoney(itemCost.cost.raw, itemCost.cost.currency)
                        : "—"
                    }
                  />
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============== Tiny row ===============
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-slate-500 text-xs">{label}</div>
      <div className="text-slate-900">{value}</div>
    </div>
  );
}
