// src/utils/datetime.ts
export const formatTimeFromSeconds = (time: any) => {
  console.log(time);
};

export function localDateTimeToIsoUtc(
  localValue: string | null | undefined
): string | null {
  if (!localValue) return null; // ej: "2025-09-17T14:10"
  const dt = new Date(localValue); // lo interpreta como hora local
  const isoUtc = new Date(
    Date.UTC(
      dt.getFullYear(),
      dt.getMonth(),
      dt.getDate(),
      dt.getHours(),
      dt.getMinutes(),
      dt.getSeconds(),
      dt.getMilliseconds()
    )
  ).toISOString();
  return isoUtc;
}
