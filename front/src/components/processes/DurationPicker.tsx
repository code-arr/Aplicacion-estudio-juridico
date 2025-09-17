// src/components/DurationPicker.tsx
import { useMemo } from "react";

type Props = {
  valueSec: number; // duración en segundos
  onChange: (sec: number) => void; // devuelve segundos
  maxHours?: number; // por defecto 12
  showSeconds?: boolean; // por defecto false
  label?: string;
};

export default function DurationPicker({
  valueSec,
  onChange,
  maxHours = 12,
  showSeconds = false,
  label = "Duración",
}: Props) {
  const h = Math.floor(valueSec / 3600);
  const m = Math.floor((valueSec % 3600) / 60);
  const s = valueSec % 60;

  const hours = useMemo(
    () => Array.from({ length: maxHours + 1 }, (_, i) => i),
    [maxHours]
  );
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  const seconds = minutes; // 0..59

  const setH = (newH: number) =>
    onChange(newH * 3600 + m * 60 + (showSeconds ? s : 0));
  const setM = (newM: number) =>
    onChange(h * 3600 + newM * 60 + (showSeconds ? s : 0));
  const setS = (newS: number) => onChange(h * 3600 + m * 60 + newS);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        {/* Columna horas */}
        <div className="flex items-center gap-2">
          <select
            value={h}
            onChange={(e) => setH(parseInt(e.target.value, 10))}
            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm shadow-sm outline-none focus:border-blue-500"
          >
            {hours.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">horas</span>
        </div>

        {/* Columna minutos */}
        <div className="flex items-center gap-2">
          <select
            value={m}
            onChange={(e) => setM(parseInt(e.target.value, 10))}
            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm shadow-sm outline-none focus:border-blue-500"
          >
            {minutes.map((x) => (
              <option key={x} value={x}>
                {x.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">minutos</span>
        </div>

        {/* (Opcional) segundos */}
        {showSeconds && (
          <div className="flex items-center gap-2">
            <select
              value={s}
              onChange={(e) => setS(parseInt(e.target.value, 10))}
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm shadow-sm outline-none focus:border-blue-500"
            >
              {seconds.map((x) => (
                <option key={x} value={x}>
                  {x.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">s</span>
          </div>
        )}
      </div>

      <div className="text-[11px] text-gray-500">
        Máximo {maxHours}h. Usá TAB / flechas para moverte rápido.
      </div>
    </div>
  );
}
