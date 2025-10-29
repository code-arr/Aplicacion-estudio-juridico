// Si lo ponés en otro archivo, exportalo y lo importás.
// Recibe la moneda y la tarifa (string opcional) y devuelve un texto formateado.
export function formatClientRate(
  currency: "CLP" | "USD" | "UF",
  rateStr?: string
) {
  if (!rateStr) return "—";
  const rate = Number(rateStr);
  if (Number.isNaN(rate)) return rateStr; // por si viene algo no numérico del back

  switch (currency) {
    case "CLP":
      // CLP suele mostrarse sin decimales
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(rate);

    case "USD":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(rate);

    case "UF":
      // Intl entiende CLF (UF). Prefiero mostrar "UF xx,xx"
      return `UF ${new Intl.NumberFormat("es-CL", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rate)}`;

    default:
      return rateStr;
  }
}
