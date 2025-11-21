import { useEffect, useState } from "react";
import { Download, RefreshCw, Loader2 } from "lucide-react"; // 👈 Agregamos Loader2

export default function UpdateListener() {
  const [info, setInfo] = useState<any | null>(null);
  const [isInstalling, setIsInstalling] = useState(false); // 👈 Nuevo estado para el spinner

  useEffect(() => {
    const unsub = window.electronAPI?.onUpdateDownloaded?.((data: any) => {
      setInfo(data);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const handleInstall = () => {
    // 1. Activamos el spinner
    setIsInstalling(true);

    // 2. Mandamos la orden (le damos un mini delay para que React llegue a renderizar el spinner antes de que se congele todo al cerrar)
    setTimeout(() => {
      window.electronAPI?.installUpdate();
    }, 150);
  };

  if (!info) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] p-8 border border-gray-200 animate-in fade-in zoom-in duration-300">
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <RefreshCw size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              ¡Actualización lista!
            </h2>
            <p className="text-gray-500">Una nueva versión está esperando.</p>
          </div>
        </div>

        {/* Texto */}
        <div className="mb-8">
          <p className="text-lg text-gray-600">
            Se ha descargado la versión{" "}
            <span className="font-bold text-gray-900">{info?.version}</span>.
            <br />
            ¿Querés instalarla y reiniciar ahora?
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          {/* Botón "Más tarde": Lo deshabilitamos si ya está instalando */}
          <button
            disabled={isInstalling}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            onClick={() => setInfo(null)}
          >
            Más tarde
          </button>

          {/* Botón de Acción */}
          <button
            disabled={isInstalling} // 👈 Evita doble clic
            className={`px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-all flex items-center gap-2 
              ${isInstalling ? "opacity-80 cursor-wait" : "hover:bg-blue-700"}
            `}
            onClick={handleInstall}
          >
            {isInstalling ? (
              <>
                {/* animate-spin hace que gire solo */}
                <Loader2 size={20} className="animate-spin" />
                Preparando...
              </>
            ) : (
              <>
                <Download size={20} />
                Instalar y Reiniciar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
