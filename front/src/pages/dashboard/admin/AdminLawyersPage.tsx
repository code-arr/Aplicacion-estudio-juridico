// src/pages/dashboard/admin/AdminLawyersPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { User } from "@/types/User";
import type { Lawyer } from "@/types/Lawyer";
import type { Client } from "@/types/Client";
import { deleteUser, getAllUsers } from "@/api/user";
import { getAllLawyers, deleteLawyer } from "@/api/lawyer";
import { getAllClients } from "@/api/client";
import { getAllClientItems } from "@/api/clientItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LawyerEditModal from "@/components/admin/LawyerEditModal";
import LawyerCreateModal from "@/components/admin/LawyerCreateModal";

type Row = {
  id: string;
  fullName: string;
  rut: string;
  email?: string;
  phone: string;
  type: string;
  workedHours: number;
  updatedAt?: string;
  clientsCount: number;
  itemsCount: number;
  userId?: string;
};

function fullName(l: Lawyer) {
  return [l.firstName, l.lastName].filter(Boolean).join(" ");
}

export default function AdminLawyersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [lawyersMap, setLawyersMap] = useState<Record<string, Lawyer>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal creación
  const [createOpen, setCreateOpen] = useState(false);

  // Modal edición
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  // 🔸 Paginación incremental
  const PAGE_STEP = 18;
  const [pageSize, setPageSize] = useState(PAGE_STEP);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        const [lawyers, clients, items, users] = await Promise.all([
          getAllLawyers() as Promise<Lawyer[]>,
          getAllClients() as Promise<Client[]>,
          getAllClientItems() as Promise<{ id: string; clientId?: string }[]>,
          getAllUsers() as Promise<User[]>,
        ]);
        if (!alive) return;

        // Mapa User por lawyerId (primer usuario que encuentre)
        console.log(users);

        const userByLawyerId = new Map<string, User>();
        for (const u of users) {
          if (u.lawyerId && !userByLawyerId.has(u.lawyerId)) {
            userByLawyerId.set(u.lawyerId, u);
          }
        }

        // Mapa de clientes por abogado
        const clientsByLawyer = new Map<string, number>();
        for (const l of lawyers) clientsByLawyer.set(l.id, 0);

        const clientMap = new Map<string, Client>();
        for (const c of clients) {
          if (c.id) clientMap.set(c.id, c);
          const linked = c.lawyers ?? [];
          for (const lw of linked) {
            if (!lw?.id) continue;
            clientsByLawyer.set(lw.id, (clientsByLawyer.get(lw.id) ?? 0) + 1);
          }
        }

        // Ítems por abogado: asigno cada item a TODOS los abogados del cliente dueño
        const itemsByLawyer = new Map<string, number>();
        for (const l of lawyers) itemsByLawyer.set(l.id, 0);
        for (const it of items) {
          const c = it.clientId ? clientMap.get(it.clientId) : undefined;
          if (!c?.lawyers?.length) continue;
          for (const lw of c.lawyers) {
            if (!lw?.id) continue;
            itemsByLawyer.set(lw.id, (itemsByLawyer.get(lw.id) ?? 0) + 1);
          }
        }

        const lmap: Record<string, Lawyer> = {};
        for (const l of lawyers) lmap[l.id] = l;

        const mapped: Row[] = lawyers.map((l) => {
          const u = userByLawyerId.get(l.id); // 🟢 user vinculado (si hay)
          return {
            id: l.id,
            fullName: fullName(l) || "—",
            rut: l.rut,
            email: u?.email ?? "—", // 🟢 email desde User
            phone: l.phone,
            type: l.type,
            workedHours: l.workedHours ?? 0,
            updatedAt: l.updatedAt ?? l.createdAt,
            clientsCount: clientsByLawyer.get(l.id) ?? 0,
            itemsCount: itemsByLawyer.get(l.id) ?? 0,
            userId: u?.id, // 🟢 guardo userId para acciones
          };
        });

        setLawyersMap(lmap);
        setRows(mapped);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar abogados");
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
      [r.fullName, r.rut, r.email, r.phone, r.type]
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

  const handleEdit = (id: string) => {
    setEditTargetId(id);
    setEditOpen(true);
  };

  const handleSaved = (updated: Lawyer) => {
    setLawyersMap((m) => ({ ...m, [updated.id]: updated }));
    setRows((prev) =>
      prev.map((r) =>
        r.id !== updated.id
          ? r
          : {
              ...r,
              fullName: fullName(updated) || "—",
              rut: updated.rut,
              email: updated.user?.email ?? r.email,
              phone: updated.phone,
              type: updated.type,
              workedHours: updated.workedHours ?? r.workedHours,
              updatedAt: updated.updatedAt ?? new Date().toISOString(),
            }
      )
    );
  };

  const handleDeleteUser = async (
    userId: string,
    lawyerName: string,
    lawyerId: string
  ) => {
    const ok = window.confirm(
      `¿Eliminar el usuario (acceso) de "${lawyerName}"?`
    );
    if (!ok) return;
    try {
      await deleteUser(userId);
      // Dejar la fila sin usuario ni email
      setRows((prev) =>
        prev.map((r) =>
          r.id === lawyerId ? { ...r, userId: undefined, email: "—" } : r
        )
      );
      alert(`El usuario de ${lawyerName} fue eliminado correctamente.`);
    } catch (e: any) {
      alert(e?.message ?? "No se pudo eliminar el usuario");
    }
  };

  const handleDelete = async (id: string, nameForConfirm?: string) => {
    const ok = window.confirm(
      `¿Eliminar al abogado "${nameForConfirm ?? "sin nombre"}"?`
    );
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteLawyer(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "No se pudo eliminar el abogado");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Abogados</h1>
        <p className="text-sm text-[#6b7280]">
          Vista global (Admin). Buscar por nombre, RUT, email, teléfono o rol.
        </p>
      </div>

      <div className="flex gap-3 items-center">
        <Input
          placeholder="Buscar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button onClick={() => setCreateOpen(true)}>Crear abogado</Button>
      </div>

      <div className="overflow-auto border border-[#e5e7eb] rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-[#f9fafb]">
            <tr className="text-left">
              <th className="px-3 py-2 text-[#374151]">Nombre</th>
              <th className="px-3 py-2 text-[#374151]">RUT</th>
              <th className="px-3 py-2 text-[#374151]">Email</th>
              <th className="px-3 py-2 text-[#374151]">Teléfono</th>
              <th className="px-3 py-2 text-[#374151]">Tipo</th>
              <th className="px-3 py-2 text-[#374151] text-center">Clientes</th>
              <th className="px-3 py-2 text-[#374151] text-center">Items</th>
              {/* <th className="px-3 py-2 text-[#374151]">Horas</th> */}
              <th className="px-3 py-2 text-[#374151]">Actualizado</th>
              <th className="px-3 py-2 text-[#374151] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-[#6b7280]" colSpan={10}>
                  Cargando…
                </td>
              </tr>
            ) : err ? (
              <tr>
                <td className="px-3 py-3 text-[#b91c1c]" colSpan={10}>
                  {err}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-[#6b7280]" colSpan={10}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]"
                >
                  <td className="px-3 py-2 text-[#111827]">{r.fullName}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.rut}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.email}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.phone}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.type}</td>
                  <td className="px-3 py-2 text-center text-[#111827]">
                    {r.clientsCount}
                  </td>
                  <td className="px-3 py-2 text-center text-[#111827]">
                    {r.itemsCount}
                  </td>
                  {/* <td className="px-3 py-2 text-[#111827]">{r.workedHours}</td> */}
                  <td className="px-3 py-2 text-[#6b7280]">
                    {r.updatedAt
                      ? new Date(r.updatedAt).toLocaleString("es-AR")
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 justify-center">
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
                        onClick={() => handleDelete(r.id, r.fullName)}
                      >
                        {deletingId === r.id ? "Eliminando…" : "Eliminar"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          r.userId &&
                          handleDeleteUser(r.userId, r.fullName, r.id)
                        }
                        disabled={!r.userId}
                        title={
                          r.userId
                            ? "Eliminar usuario (acceso)"
                            : "Este abogado no tiene usuario"
                        }
                      >
                        Eliminar usuario
                      </Button>
                    </div>
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

      <LawyerCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => {
          // ejemplo: si el backend responde { lawyer: {...}, user: {...} }
          const newLawyer = created?.lawyer ?? created;
          if (!newLawyer?.id) return;
          setLawyersMap((m) => ({ ...m, [newLawyer.id]: newLawyer }));
          setRows((prev) => [
            {
              id: newLawyer.id,
              fullName: [newLawyer.firstName, newLawyer.lastName]
                .filter(Boolean)
                .join(" "),
              rut: newLawyer.rut,
              email: created?.user?.email ?? "—",
              phone: newLawyer.phone ?? "—",
              type: newLawyer.type ?? "—",
              workedHours: newLawyer.workedHours ?? 0,
              updatedAt: newLawyer.updatedAt ?? newLawyer.createdAt,
              clientsCount: 0,
              itemsCount: 0,
              userId: created?.user?.id,
            },
            ...prev,
          ]);
        }}
      />
      {editTargetId && lawyersMap[editTargetId] && (
        <LawyerEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          lawyer={lawyersMap[editTargetId]}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
