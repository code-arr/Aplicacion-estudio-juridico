// src/pages/dashboard/admin/AdminLawyersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { getAllLawyers } from "@/api/admin";
import type { Lawyer } from "@/types/Lawyer";
import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  fullName: string;
  rut: string;
  email?: string; // si viene por user?.email más adelante
  phone: string;
  type: string;
  seniorityLevel: string;
  workedHours: number;
  updatedAt?: string;
};

function fullName(l: Lawyer) {
  return [l.firstName, l.lastName].filter(Boolean).join(" ");
}

export default function AdminLawyersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data: Lawyer[] = await getAllLawyers();
        if (!alive) return;

        const mapped: Row[] = data.map((l) => ({
          id: l.id,
          fullName: fullName(l) || "—",
          rut: l.rut,
          email: l.user?.email, // si tu back lo completa
          phone: l.phone,
          type: l.type,
          seniorityLevel: l.seniorityLevel,
          workedHours: l.workedHours,
          updatedAt: l.updateAt ?? l.createAt,
        }));

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
      [r.fullName, r.rut, r.email, r.phone, r.type, r.seniorityLevel]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(s))
    );
  }, [q, rows]);

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
              <th className="px-3 py-2 text-[#374151]">Seniority</th>
              <th className="px-3 py-2 text-[#374151]">Horas</th>
              <th className="px-3 py-2 text-[#374151]">Actualizado</th>
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
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]"
                >
                  <td className="px-3 py-2 text-[#111827]">{r.fullName}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.rut}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.email ?? "—"}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.phone}</td>
                  <td className="px-3 py-2 text-[#111827]">{r.type}</td>
                  <td className="px-3 py-2 text-[#111827]">
                    {r.seniorityLevel}
                  </td>
                  <td className="px-3 py-2 text-[#111827]">
                    {r.workedHours ?? 0}
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
    </div>
  );
}
