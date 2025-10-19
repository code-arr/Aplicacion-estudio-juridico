import type { ClientItem } from "@/types/ClientItem";

const pickMillis = (it: ClientItem) =>
  new Date(it.updatedAt ?? it.createdAt ?? 0).getTime();

const compareRecentDesc = (a: ClientItem, b: ClientItem) => {
  const diff = pickMillis(b) - pickMillis(a);
  if (diff) return diff;
  // fallback estable si empatan fechas
  return String(b.id).localeCompare(String(a.id));
};

export const topNRecent = (items: ClientItem[], n = 4) =>
  items.slice().sort(compareRecentDesc).slice(0, n);

// útil para evitar renders si el contenido no cambió
export const sameIds = (a: ClientItem[], b: ClientItem[]) =>
  a.length === b.length && a.every((x, i) => x.id === b[i].id);
