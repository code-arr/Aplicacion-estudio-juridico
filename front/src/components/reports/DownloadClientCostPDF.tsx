// src/components/reports/DownloadClientCostPDF.tsx
import React from "react";
import { downloadClientCostPdf, type PeriodType } from "@/api/reports";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type Props = {
  clientId?: string | null;
  clientLabel?: string; // para nombre de archivo
  defaultYear?: number;
  className?: string;
};

export default function DownloadClientCostPDF({
  clientId,
  clientLabel,
  defaultYear,
  className = "",
}: Props) {
  const now = new Date();
  const [open, setOpen] = React.useState(false);
  const [periodType, setPeriodType] = React.useState<PeriodType>("month");
  const [year, setYear] = React.useState<number>(
    defaultYear ?? now.getFullYear()
  );
  const [month, setMonth] = React.useState<number>(now.getMonth() + 1); // 1..12
  const [includeLogo, setIncludeLogo] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    setError(null);
    if (!clientId) {
      setError("Seleccioná un cliente.");
      return;
    }
    if (periodType === "month" && (!month || month < 1 || month > 12)) {
      setError("Mes inválido.");
      return;
    }
    setLoading(true);
    try {
      const blob = await downloadClientCostPdf({
        clientId,
        periodType,
        year,
        month: periodType === "month" ? month : undefined,
        includeLogo,
      });
      const periodo =
        periodType === "month"
          ? `${MONTHS_ES[(month ?? 1) - 1]}-${year}`
          : `Año-${year}`;
      const name =
        (clientLabel?.trim()
          ? clientLabel.trim().replace(/\s+/g, "_")
          : "cliente") + `-honorarios-${periodo}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo descargar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 ${className}`}
      >
        Descargar PDF
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => !loading && setOpen(false)}
          />

          {/* modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Descargar resumen de honorarios
              </h3>
              <p className="text-xs text-slate-500">
                Elegí el período a incluir en el PDF.
              </p>
            </div>

            {/* Periodo */}
            <div className="space-y-3">
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    className="h-4 w-4"
                    name="periodType"
                    value="month"
                    checked={periodType === "month"}
                    onChange={() => setPeriodType("month")}
                  />
                  Mes
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    className="h-4 w-4"
                    name="periodType"
                    value="year"
                    checked={periodType === "year"}
                    onChange={() => setPeriodType("year")}
                  />
                  Año
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`${periodType === "year" ? "opacity-50" : ""}`}>
                  <label className="block text-xs text-slate-500 mb-1">
                    Mes
                  </label>
                  <select
                    disabled={periodType === "year"}
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                  >
                    {MONTHS_ES.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                    min={2000}
                    max={9999}
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                />
                Incluir logo del estudio
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Generando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
