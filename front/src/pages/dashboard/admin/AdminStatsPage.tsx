// src/pages/dashboard/admin/AdminStatsPage.tsx
import { useEffect, useState } from "react";
import { getAllClientItems } from "@/api/admin";
import { Card } from "@/components/ui/card";

function toHMS(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalLawyers: number;
    totalClients: number;
    totalDocuments: number;
    totalTimeSec: number;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAllClientItems();
        if (!alive) return;
        setStats(data);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar estadísticas");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-[#111827]">Estadísticas</h1>

      {loading ? (
        <p className="text-[#6b7280]">Cargando…</p>
      ) : err ? (
        <p className="text-[#b91c1c]">{err}</p>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-[#e5e7eb]">
            <div className="text-sm text-[#6b7280]">Abogados</div>
            <div className="text-2xl font-semibold text-[#111827]">
              {stats.totalLawyers}
            </div>
          </Card>

          <Card className="p-4 border border-[#e5e7eb]">
            <div className="text-sm text-[#6b7280]">Clientes</div>
            <div className="text-2xl font-semibold text-[#111827]">
              {stats.totalClients}
            </div>
          </Card>

          <Card className="p-4 border border-[#e5e7eb]">
            <div className="text-sm text-[#6b7280]">Documentos</div>
            <div className="text-2xl font-semibold text-[#111827]">
              {stats.totalDocuments}
            </div>
          </Card>

          <Card className="p-4 border border-[#e5e7eb]">
            <div className="text-sm text-[#6b7280]">Tiempo total</div>
            <div className="text-2xl font-semibold text-[#111827]">
              {toHMS(stats.totalTimeSec)}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
