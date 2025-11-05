// src/utils/datetime.ts
export const formatTimeFromSeconds = (time: any) => {
  console.log(time);
};

export function localDateTimeToIsoUtc(
  localValue: string | null | undefined
): string | null {
  if (!localValue) return null; // "2025-11-04T23:38"
  // ✅ Interpreta el string como hora local y lo convierte a UTC real
  return new Date(localValue).toISOString(); // "2025-11-05T02:38:00.000Z" si estás en -03
}
