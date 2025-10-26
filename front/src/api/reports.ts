// src/api/reports.ts
import axios from "./axios";

export type PeriodType = "month" | "year";

export async function downloadClientCostPdf(opts: {
  clientId: string;
  periodType: PeriodType;
  year: number;
  month?: number; // 1..12 si periodType === "month"
  logoUrl?: string | null; // si querés incluir logo, pasa la URL
}) {
  const params: any = {
    clientId: opts.clientId,
    year: opts.year,
  };
  if (opts.periodType === "month") {
    if (!opts.month)
      throw new Error("month es requerido cuando periodType=month");
    params.month = opts.month;
  }
  if (opts.logoUrl) {
    params.logoUrl = opts.logoUrl; // el back ya lo acepta como opcional
  }

  const res = await axios.get("/reports/client-cost-summary", {
    params,
    responseType: "blob",
  });
  return res.data as Blob;
}
