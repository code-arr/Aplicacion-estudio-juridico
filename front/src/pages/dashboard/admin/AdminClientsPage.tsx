// src/pages/dashboard/admin/AdminClientsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Client } from "@/types/Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllClients, deleteClient } from "@/api/client"; // ⇐ asumo deleteClient existe
import { getAllClientItems } from "@/api/clientItem"; // ⇐ para contar items
import ClientEditModal from "@/components/admin/ClientEditModal";

type Row = {
  id?: string;
  displayName: string;
  rut: string;
  email: string;
  phone?: string;
  status?: string;
  itemsCount: number;
  updatedAt?: string;
};

function clientDisplayName(c: Client) {
  return c.companyName ?? [c.firstName, c.lastName].filter(Boolean).join(" ");
}

export default function AdminClientsPage() {
  const [clientsMap, setClientsMap] = useState<Record<string, Client>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 🔸 Paginación incremental
  const PAGE_STEP = 18;
  const [pageSize, setPageSize] = useState(PAGE_STEP);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [clients, items] = await Promise.all([
          getAllClients() as Promise<Client[]>,
          getAllClientItems() as Promise<{ id?: string; clientId?: string }[]>,
        ]);
        if (!alive) return;

        const map: Record<string, Client> = {};
        (clients ?? []).forEach((c) => c.id && (map[c.id] = c));

        const countByClientId = new Map<string, number>();
        (items ?? []).forEach((it) => {
          if (!it.clientId) return;
          countByClientId.set(
            it.clientId,
            (countByClientId.get(it.clientId) ?? 0) + 1
          );
        });

        const mapped: Row[] = (clients ?? []).map((c) => ({
          id: c.id,
          displayName: clientDisplayName(c) || "—",
          rut: c.rut,
          email: c.email,
          phone: c.phone,
          status: c.status,
          itemsCount: c.id ? countByClientId.get(c.id) ?? 0 : 0,
          updatedAt: c.updatedAt ?? c.createdAt,
        }));

        setClientsMap(map);
        setRows(mapped);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar clientes");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.displayName, r.rut, r.email, r.phone, r.status, String(r.itemsCount)]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(s))
    );
  }, [q, rows]);

  const total = filtered.length;
  const visible = useMemo(
    () => filtered.slice(0, pageSize),
    [filtered, pageSize]
  );

  useEffect(() => {
    setPageSize(PAGE_STEP);
  }, [q]);

  // ===== Acciones =====
  const handleEdit = (id?: string) => {
    if (!id) return;
    setEditTargetId(id);
    setEditOpen(true);
  };

  const handleSaved = (updated: Client) => {
    if (!updated.id) return;
    setClientsMap((m) => ({ ...m, [updated.id!]: updated }));
    setRows((prev) =>
      prev.map((r) =>
        r.id !== updated.id
          ? r
          : {
              ...r,
              displayName: clientDisplayName(updated) || "—",
              rut: updated.rut,
              email: updated.email,
              phone: updated.phone,
              status: updated.status,
              updatedAt: updated.updatedAt ?? new Date().toISOString(),
            }
      )
    );
  };

  const handleDelete = async (id?: string, nameForConfirm?: string) => {
    if (!id) return;
    const ok = window.confirm(
      `¿Eliminar el cliente "${
        nameForConfirm ?? "sin nombre"
      }"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteClient(id);
      // Optimista: lo saco de la lista
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "No se pudo eliminar el cliente");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Clientes</h1>
        <p className="text-sm text-[#6b7280]">
          Vista global (Admin). Buscar por nombre/empresa, RUT, email o
          teléfono.
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
        <table className="w-full text-sm">
          <thead className="bg-[#f9fafb]">
            <tr className="text-left">
              <th className="px-3 py-2 text-[#374151]">Cliente</th>
              <th className="px-3 py-2 text-[#374151]">RUT</th>
              <th className="px-3 py-2 text-[#374151]">Email</th>
              <th className="px-3 py-2 text-[#374151]">Teléfono</th>
              <th className="px-3 py-2 text-[#374151]">Estado</th>
              <th className="px-3 py-2 text-[#374151] text-right">Items</th>
              <th className="px-3 py-2 text-[#374151]">Actualizado</th>
              <th className="px-3 py-2 text-[#374151]">Acciones</th>
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
            ) : filtered.length === 0 ? (
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
                  <td className="px-3 py-2 text-[#111827]">{r.displayName}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.rut}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.email}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.phone ?? "—"}</td>
                  <td className="px-3 py-2 text-[#111827]">
                    {r.status ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[#111827] text-center">
                    {r.itemsCount}
                  </td>
                  <td className="px-3 py-2 text-[#6b7280]">
                    {r.updatedAt
                      ? new Date(r.updatedAt).toLocaleString("es-AR")
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(r.id)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === r.id}
                        onClick={() => handleDelete(r.id, r.displayName)}
                      >
                        {deletingId === r.id ? "Eliminando…" : "Eliminar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Botón Ver más */}
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
      {/* Modal de edición */}
      {editTargetId && clientsMap[editTargetId] && (
        <ClientEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          client={clientsMap[editTargetId]}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
