import { useEffect, useState } from "react";
import { X, Download, RefreshCw } from "lucide-react"; // Si tenés lucide, queda más lindo. Si no, sacalo.

export default function UpdateListener() {
  const [info, setInfo] = useState<any | null>(null);

  useEffect(() => {
    // Escuchamos cuando ya se bajó
    const unsub = window.electronAPI?.onUpdateDownloaded?.((data: any) => {
      setInfo(data);
    });

    // Escuchamos cuando hay una disponible (opcional, solo log)
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
    // 1. El fondo oscuro que cubre toda la pantalla (Overlay)
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* 2. La tarjeta del modal */}
      <div className="bg-white rounded-xl shadow-2xl w-[500px] p-8 border border-gray-200 animate-in fade-in zoom-in duration-300">
        {/* Título e Icono */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <RefreshCw size={32} /> {/* O un emoji 🚀 si no tenés lucide */}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              ¡Actualización lista!
            </h2>
            <p className="text-gray-500">Una nueva versión está esperando.</p>
          </div>
        </div>

        {/* Mensaje del cuerpo */}
        <div className="mb-8">
          <p className="text-lg text-gray-600">
            Se ha descargado la versión{" "}
            <span className="font-bold text-gray-900">{info?.version}</span>.
            <br />
            ¿Querés instalarla y reiniciar ahora para aplicar los cambios?
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          {/* Botón "Más tarde" (Importante por si están en una reunión) */}
          <button
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            onClick={() => setInfo(null)}
          >
            Más tarde
          </button>

          {/* Botón "Instalar" (Grande y llamativo) */}
          <button
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
            onClick={() => window.electronAPI?.installUpdate()}
          >
            <Download size={20} />
            Instalar y Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}
