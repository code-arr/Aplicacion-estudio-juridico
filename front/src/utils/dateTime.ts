// src/utils/datetime.ts
export const formatTimeFromSeconds = (time: any) => {
  console.log(time);
};

// Recibe "YYYY-MM-DDTHH:MM" y devuelve ISO UTC "2025-11-05T02:38:00.000Z"
export function localDateTimeToIsoUtc(localValue: string): string {
  if (!localValue) throw new Error("localDateTimeToIsoUtc: missing localValue");
  // new Date(localValue) interpreta como local y toISOString() lo convierte a UTC
  const d = new Date(localValue);
  if (isNaN(d.getTime()))
    throw new Error("localDateTimeToIsoUtc: invalid date");
  return d.toISOString();
}
