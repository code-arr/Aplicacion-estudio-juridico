// src/pages/dashboard/admin/AdminItemsPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { ClientItem } from "@/types/ClientItem";
import type { Client } from "@/types/Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllClientItems, deleteClientItem } from "@/api/clientItem";
import { getAllClients } from "@/api/client";
import { useCatalogStore } from "@/store/useCatalogStore";
import ClientItemEditModal from "@/components/admin/ClientItemEditModal";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdownMenu";
import { Lock, Unlock } from "lucide-react";

type Row = {
  id?: string;
  title: string;
  clientName: string;
  status?: string;
  categoryId?: string;
  sectionId?: string;
  itemTypeId?: string;
  private?: boolean; // ✅ agregado
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
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 🔹 items originales por id (para editar sin inventar tipos)
  const [itemsById, setItemsById] = useState<Record<string, ClientItem>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClientItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Catálogo
  const categories = useCatalogStore((s) => s.categories);
  const sections = useCatalogStore((s) => s.sections);
  const itemTypes = useCatalogStore((s) => s.itemTypes);

  // Mapas id → nombre
  const { catMap, secMap, itMap } = useMemo(() => {
    const catMap = new Map<string, string>();
    const secMap = new Map<string, string>();
    const itMap = new Map<string, string>();
    (categories ?? []).forEach((x) => x?.id && catMap.set(x.id, x.name));
    (sections ?? []).forEach((x) => x?.id && secMap.set(x.id, x.name));
    (itemTypes ?? []).forEach((x) => x?.id && itMap.set(x.id, x.name));
    return { catMap, secMap, itMap };
  }, [categories, sections, itemTypes]);

  const PAGE_STEP = 18;
  const [pageSize, setPageSize] = useState(PAGE_STEP);

  // === carga inicial ===
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        const [items, clients] = await Promise.all([
          getAllClientItems() as Promise<ClientItem[]>,
          getAllClients() as Promise<Client[]>,
        ]);
        if (!alive) return;

        // 👉 construir diccionario una sola vez acá
        const dict: Record<string, ClientItem> = {};
        for (const it of items) {
          if (it.id) dict[it.id] = it;
        }
        setItemsById(dict);

        // Diccionario id -> nombre cliente
        const nameByClientId = new Map<string, string>();
        clients.forEach((c) => {
          if (!c.id) return;
          nameByClientId.set(c.id, clientDisplayName(c) || "—");
        });

        // Filas para la tabla
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
          private: it.private ?? false, // ✅ agregado
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

  // Enriquecidos con nombres de catálogo
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

  // Búsqueda
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

  useEffect(() => {
    setPageSize(PAGE_STEP);
  }, [q]);

  function handleEdit(id?: string) {
    if (!id) return;
    const original = itemsById[id];
    if (!original) return;
    setEditTarget(original);
    setEditOpen(true);
  }

  function handleSaved(updated: ClientItem) {
    setItemsById((prev) => ({ ...prev, [updated.id!]: updated }));
    setRows((prev) =>
      prev.map((r) =>
        r.id !== updated.id
          ? r
          : {
              ...r,
              title: updated.title ?? r.title,
              status: updated.status ?? r.status,
              categoryId: updated.categoryId ?? r.categoryId,
              sectionId: updated.sectionId ?? r.sectionId,
              itemTypeId: updated.itemTypeId ?? r.itemTypeId,
              updatedAt: updated.updatedAt ?? new Date().toISOString(),
            }
      )
    );
  }

  async function handleDelete(id?: string, title?: string) {
    if (!id) return;
    const ok = window.confirm(`¿Eliminar el item "${title ?? "sin título"}"?`);
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteClientItem(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setItemsById((prev) => {
        const { [id]: _omit, ...rest } = prev;
        return rest;
      });
    } catch (e: any) {
      alert(e?.message ?? "No se pudo eliminar el item");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Items</h1>
        <p className="text-sm text-[#6b7280]">
          Vista global (Admin). Buscar por título, cliente, estado, categoría,
          sección o tipo.
        </p>
      </div>

      <div className="flex gap-3 items-center">
        <Input
          placeholder="Buscar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-auto border border-[#e5e7eb] rounded-md">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
            <col className="w-[14%] hidden lg:table-column" />
            <col className="w-[14%] hidden xl:table-column" />
            <col className="w-[12%] hidden xl:table-column" />
            <col className="w-[12%]" />
            <col className="w-[56px]" />
          </colgroup>

          <thead className="bg-[#f9fafb]">
            <tr className="text-left">
              <th className="px-3 py-2 text-[#374151]">Título</th>
              <th className="px-3 py-2 text-[#374151]">Cliente</th>
              <th className="px-3 py-2 text-[#374151]">Estado</th>
              <th className="px-3 py-2 text-[#374151] hidden lg:table-cell">
                Categoría
              </th>
              <th className="px-3 py-2 text-[#374151] hidden xl:table-cell">
                Sección
              </th>
              <th className="px-3 py-2 text-[#374151] hidden xl:table-cell">
                Tipo
              </th>
              <th className="px-3 py-2 text-[#374151] whitespace-nowrap">
                Actualizado
              </th>
              <th className="px-3 py-2 text-[#374151] text-right whitespace-nowrap">
                Acc.
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-[#6b7280]" colSpan={8}>
                  Cargando…
                </td>
              </tr>
            ) : err ? (
              <tr>
                <td className="px-3 py-3 text-[#b91c1c]" colSpan={8}>
                  {err}
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-[#6b7280]" colSpan={8}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]"
                >
                  <td
                    className="px-3 py-2 text-[#111827] max-w-[320px] truncate flex items-center gap-1"
                    title={r.title}
                  >
                    {r.private ? (
                      <Lock size={14} className="text-gray-500" />
                    ) : (
                      <Unlock size={14} className="text-gray-400" />
                    )}
                    <span className="truncate">{r.title}</span>
                  </td>
                  <td
                    className="px-3 py-2 text-[#111827] max-w-[240px] truncate"
                    title={r.clientName}
                  >
                    {r.clientName}
                  </td>
                  <td className="px-3 py-2 text-[#111827] whitespace-nowrap">
                    {r.status ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[#111827] hidden lg:table-cell truncate">
                    {r.categoryName}
                  </td>
                  <td className="px-3 py-2 text-[#111827] hidden xl:table-cell truncate">
                    {r.sectionName}
                  </td>
                  <td className="px-3 py-2 text-[#111827] hidden xl:table-cell truncate">
                    {r.itemTypeName}
                  </td>
                  <td className="px-3 py-2 text-[#6b7280] whitespace-nowrap">
                    {r.updatedAt
                      ? new Date(r.updatedAt).toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                  <td className="px-2 py-1 text-right">
                    <DropdownMenuRoot>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Acciones"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="currentColor"
                          >
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => handleEdit(r.id)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(r.id, r.title)}
                        >
                          {deletingId === r.id ? "Eliminando…" : "Eliminar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuRoot>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

      {editTarget && (
        <ClientItemEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          item={editTarget}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
