// src/pages/dashboard/admin/AdminItemsPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { ClientItem } from "@/types/ClientItem";
import type { Client } from "@/types/Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllClientItems } from "@/api/clientItem";
import { getAllClients } from "@/api/client";
import { useCatalogStore } from "@/store/useCatalogStore";

// === Tipado simple de la fila que mostramos en la tabla ===
type Row = {
  id?: string;
  title: string;
  clientName: string;
  status?: string;
  categoryId?: string;
  sectionId?: string;
  itemTypeId?: string;
  updatedAt?: string;
};

type RowWithNames = Row & {
  categoryName: string;
  sectionName: string;
  itemTypeName: string;
};

function clientDisplayName(c: Client) {
  return c.companyName ?? [c.firstName, c.lastName].filter(Boolean).join(" ");
}

export default function AdminItemsPage() {
  // === estado de datos / ui ===
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Catálogo (para resolver nombres)
  const categories = useCatalogStore((s) => s.categories);
  const sections = useCatalogStore((s) => s.sections);
  const itemTypes = useCatalogStore((s) => s.itemTypes);

  // Mapas id → nombre (memoizados)
  const { catMap, secMap, itMap } = useMemo(() => {
    const catMap = new Map<string, string>();
    const secMap = new Map<string, string>();
    const itMap = new Map<string, string>();
    (categories ?? []).forEach((x) => x?.id && catMap.set(x.id, x.name));
    (sections ?? []).forEach((x) => x?.id && secMap.set(x.id, x.name));
    (itemTypes ?? []).forEach((x) => x?.id && itMap.set(x.id, x.name));
    return { catMap, secMap, itMap };
  }, [categories, sections, itemTypes]);

  // Paginación simple “Ver más”
  const PAGE_STEP = 18;
  const [pageSize, setPageSize] = useState(PAGE_STEP);

  // === carga inicial ===
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // Traemos items y clientes para poder mostrar el nombre del cliente
        const [items, clients] = await Promise.all([
          getAllClientItems() as Promise<ClientItem[]>,
          getAllClients() as Promise<Client[]>,
        ]);
        if (!alive) return;

        // Diccionario id -> nombre cliente
        const nameByClientId = new Map<string, string>();
        clients.forEach((c) => {
          if (!c.id) return;
          nameByClientId.set(c.id, clientDisplayName(c) || "—");
        });

        // Mapeo de items a filas base (guardamos IDs, resolvemos nombres más abajo)
        const mapped: Row[] = items.map((it) => ({
          id: it.id,
          title: it.title ?? "—",
          clientName: it.clientId
            ? nameByClientId.get(it.clientId) ?? it.clientId
            : "—",
          status: it.status ?? "—",
          categoryId: it.categoryId,
          sectionId: it.sectionId,
          itemTypeId: it.itemTypeId,
          updatedAt: it.updatedAt ?? it.createdAt,
        }));

        setRows(mapped);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar items");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Enriquecemos filas con nombres legibles desde el catálogo
  const rowsWithNames: RowWithNames[] = useMemo(() => {
    const nameOrDash = (m: Map<string, string>, id?: string) =>
      id ? m.get(id) ?? "—" : "—";

    return rows.map((r) => ({
      ...r,
      categoryName: nameOrDash(catMap, r.categoryId),
      sectionName: nameOrDash(secMap, r.sectionId),
      itemTypeName: nameOrDash(itMap, r.itemTypeId),
    }));
  }, [rows, catMap, secMap, itMap]);

  // === búsqueda básica en memoria (ahora por NOMBRES, no IDs) ===
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rowsWithNames;
    return rowsWithNames.filter((r) =>
      [
        r.title,
        r.clientName,
        r.status,
        r.categoryName,
        r.sectionName,
        r.itemTypeName,
      ]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(s))
    );
  }, [q, rowsWithNames]);

  const total = filtered.length;
  const visible = useMemo(
    () => filtered.slice(0, pageSize),
    [filtered, pageSize]
  );

  // Reset de paginación cuando cambia la búsqueda
  useEffect(() => {
    setPageSize(PAGE_STEP);
  }, [q]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Items</h1>
        <p className="text-sm text-[#6b7280]">
          Vista global (Admin). Buscar por título, cliente, estado, categoría,
          sección o tipo.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Buscar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-auto border border-[#e5e7eb] rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-[#f9fafb]">
            <tr className="text-left">
              <th className="px-3 py-2 text-[#374151]">Título</th>
              <th className="px-3 py-2 text-[#374151]">Cliente</th>
              <th className="px-3 py-2 text-[#374151]">Estado</th>
              <th className="px-3 py-2 text-[#374151]">Categoría</th>
              <th className="px-3 py-2 text-[#374151]">Sección</th>
              <th className="px-3 py-2 text-[#374151]">Tipo</th>
              <th className="px-3 py-2 text-[#374151]">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-[#6b7280]" colSpan={7}>
                  Cargando…
                </td>
              </tr>
            ) : err ? (
              <tr>
                <td className="px-3 py-3 text-[#b91c1c]" colSpan={7}>
                  {err}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-[#6b7280]" colSpan={7}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]"
                >
                  <td className="px-3 py-2 text-[#111827]">{r.title}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.clientName}</td>
                  <td className="px-3 py-2 text-[#111827]">
                    {r.status ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[#111827]">{r.categoryName}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.sectionName}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.itemTypeName}</td>
                  <td className="px-3 py-2 text-[#6b7280]">
                    {r.updatedAt
                      ? new Date(r.updatedAt).toLocaleString("es-AR")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ver más (paginación incremental) */}
      {!loading && !err && total > PAGE_STEP && visible.length < total && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPageSize((s) => s + PAGE_STEP)}
          >
            Ver más
          </Button>
        </div>
      )}
    </div>
  );
}
