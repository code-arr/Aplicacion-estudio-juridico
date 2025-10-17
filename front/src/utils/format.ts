// src/utils/format.ts
export function formatARDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  // Fecha y hora corta en es-AR (ej: 13 oct 2025, 14:35)
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
