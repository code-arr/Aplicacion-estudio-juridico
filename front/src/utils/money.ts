// src/utils/money.ts
import type { Currency } from "@/types/EntryDay";

export function formatMoney(amount: number, currency: Currency | null) {
  if (!currency) return amount.toFixed(2);
  if (currency === "CLP") {
    const parts = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `$${parts}`;
  }
  if (currency === "UF") {
    const with2 = amount.toFixed(2).replace(".", ",");
    const [int, dec] = with2.split(",");
    const intMiles = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `UF ${intMiles},${dec}`;
  }
  // USD → miles con coma, sin decimales (según pedido)
  const noDec = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `USD ${noDec}`;
}
