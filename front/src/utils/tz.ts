// Utilidades simples de TZ (sin libs externas)
// Nota: asume entorno moderno con Intl API disponible.

export function getChileTz(): string {
  return "America/Santiago";
}

export function startOfNextDayMs(
  tz: string,
  fromMs: number = Date.now()
): number {
  const d = new Date(fromMs);

  // Construir "fecha local" en TZ target
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
  }).format(d);
  const m = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "2-digit",
  }).format(d);
  const dd = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    day: "2-digit",
  }).format(d);

  // 00:00 del día siguiente (en TZ)
  const nextLocal = new Date(`${y}-${m}-${dd}T00:00:00`);
  // Sumamos 1 día en TZ (24h)
  const next = new Date(nextLocal.getTime() + 24 * 60 * 60 * 1000);

  // Truco: obtener la epoch real del "00:00" en esa TZ
  // Creamos cadena en ISO sin TZ (tratada como local) y usamos formatToParts inverso
  const asLocale = new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(next)
      .replace(",", "")
      .replace(" ", "T")
  );

  return asLocale.getTime();
}
