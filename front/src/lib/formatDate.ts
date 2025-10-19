const DEFAULT_TZ = import.meta.env.VITE_APP_TZ ?? "America/Santiago";

/** Capitaliza la primera letra (para "lun" -> "Lun") */
function capitalize(str: string): string {
  return str.length ? str[0].toUpperCase() + str.slice(1) : str;
}

type Style = "short" | "numeric";
type CommonOpts = {
  timeZone?: string;
  locale?: string;
  withSeconds?: boolean;
};

/** ============ Formatos principales (ya existentes) ============ */
export function formatDateTZ(
  iso: string | Date,
  style: Style = "short",
  opts: CommonOpts = {}
): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const timeZone = opts.timeZone ?? DEFAULT_TZ;
  const locale = opts.locale ?? "es-CL";

  if (style === "numeric") {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      ...(opts.withSeconds ? { second: "2-digit" } : {}),
      hour12: false,
    }).format(d);
  }

  // "13 Oct 2025 14:35"
  const dateParts = new Intl.DateTimeFormat(locale, {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .formatToParts(d)
    .map((p) => p.value)
    .join("")
    .replace(/,\s?/g, "")
    .replace(/\s+/g, " ");

  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    ...(opts.withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  })
    .format(d)
    .replace(",", "");

  const [dd, mon, yyyy] = dateParts.split(" ");
  return `${dd} ${capitalize(mon)} ${yyyy} ${time}`.trim();
}

export function formatDateChileShort(
  iso: string | Date,
  opts?: Omit<CommonOpts, "timeZone">
) {
  return formatDateTZ(iso, "short", { ...opts, timeZone: DEFAULT_TZ });
}

export function formatDateChileNumeric(
  iso: string | Date,
  opts?: Omit<CommonOpts, "timeZone">
) {
  return formatDateTZ(iso, "numeric", { ...opts, timeZone: DEFAULT_TZ });
}

/** ============ NUEVOS: tus helpers "weekday corto" y "hora" ============ */

/** "Lun, 23 ago." (o "Lun 23 ago." según locale) — SIEMPRE en la TZ configurada */
export function formatDateWeekdayShort(
  iso: string | Date,
  opts: Omit<CommonOpts, "withSeconds"> = {}
) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const timeZone = opts.timeZone ?? DEFAULT_TZ;
  const locale = opts.locale ?? "es-ES"; // es-ES da abreviaturas cortas lindas

  let out = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short", // lun, mar, mié…
    day: "numeric",
    month: "short", // ago., oct., etc.
  }).format(d);

  // Normalizamos/quitamos coma extra y capitalizamos el weekday
  out = out.replace(",", "").replace(/\s+/g, " ").trim();
  const parts = out.split(" ");
  if (parts.length >= 1) parts[0] = capitalize(parts[0]); // "Lun"
  return parts.join(" ");
}

/** "14:35" o "14:35:12" — SIEMPRE en la TZ configurada */
export function formatTimeTZ(
  iso: string | Date,
  opts: Omit<CommonOpts, "locale"> & { locale?: string } = {}
) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const timeZone = opts.timeZone ?? DEFAULT_TZ;
  const locale = opts.locale ?? "es-CL";
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    ...(opts.withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  }).format(d);
}

/** Azúcar con TZ por defecto (Chile) */
export const formatTimeChile = (iso: string | Date, withSeconds = false) =>
  formatTimeTZ(iso, { withSeconds, timeZone: DEFAULT_TZ });

/** ============ Compuestos útiles (por si te sirven en la UI) ============ */

/** Ej: "Lun 23 ago. — 14:35" */
export function formatDayAndTime(iso: string | Date, withSeconds = false) {
  return `${formatDateWeekdayShort(iso)} — ${formatTimeChile(
    iso,
    withSeconds
  )}`;
}
