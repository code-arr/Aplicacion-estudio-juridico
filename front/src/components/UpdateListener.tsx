// src/components/UpdateListener.tsx
import { useEffect, useState } from "react";

export default function UpdateListener() {
  const [info, setInfo] = useState<any | null>(null);

  useEffect(() => {
    // nos suscribimos al evento expuesto por preload
    const unsub = window.electronAPI?.onUpdateDownloaded?.((data: any) => {
      setInfo(data);
    });

    // por si querés mostrar cuando está disponible (no descargada)
    const unsub2 = window.electronAPI?.onUpdateAvailable?.((data: any) => {
      console.log("Update available", data);
    });

    return () => {
      if (typeof unsub === "function") unsub();
      if (typeof unsub2 === "function") unsub2();
    };
  }, []);

  if (!info) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-3 bg-white border rounded shadow">
      <div className="text-sm">Nueva versión disponible: {info?.version}</div>
      <div className="mt-2 flex gap-2">
        <button
          className="px-3 py-1 border rounded text-sm"
          onClick={() => window.electronAPI?.installUpdate()}
        >
          Instalar y reiniciar
        </button>
        <button
          className="px-3 py-1 border rounded text-sm"
          onClick={() => setInfo(null)}
        >
          Más tarde
        </button>
      </div>
    </div>
  );
}
