// src/pages/dashboard/admin/AdminClientsPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Client } from "@/types/Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllClients } from "@/api/client";

type Row = {
  id?: string;
  displayName: string;
  rut: string;
  email: string;
  phone?: string;
  status?: string;
  updatedAt?: string;
};

function clientDisplayName(c: Client) {
  return c.companyName ?? [c.firstName, c.lastName].filter(Boolean).join(" ");
}

export default function AdminClientsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 🔸 Paginación incremental
  const PAGE_STEP = 18;
  const [pageSize, setPageSize] = useState(PAGE_STEP);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAllClients();
        if (!alive) return;

        const mapped: Row[] = data.map((c) => ({
          id: c.id,
          displayName: clientDisplayName(c) || "—",
          rut: c.rut,
          email: c.email,
          phone: c.phone,
          status: c.status,
          updatedAt: c.updatedAt ?? c.createdAt,
        }));

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
      [r.displayName, r.rut, r.email, r.phone, r.status]
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
              <th className="px-3 py-2 text-[#374151]">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-[#6b7280]" colSpan={6}>
                  Cargando…
                </td>
              </tr>
            ) : err ? (
              <tr>
                <td className="px-3 py-3 text-[#b91c1c]" colSpan={6}>
                  {err}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-[#6b7280]" colSpan={6}>
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
    </div>
  );
}
