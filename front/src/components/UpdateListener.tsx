import { useEffect, useState } from "react";
import { Download, RefreshCw, Loader2, ExternalLink } from "lucide-react"; // 👈 Agregamos ExternalLink

export default function UpdateListener() {
  const [info, setInfo] = useState<any | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  // 🍎 Detectamos si es Mac
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  useEffect(() => {
    // Escucha cuando se bajó (Windows)
    const unsub = window.electronAPI?.onUpdateDownloaded?.((data: any) => {
      setInfo(data);
    });

    // 🍎 TRUCO MAC: Como a veces no baja el zip por error,
    // escuchamos también si está "disponible" para avisar igual.
    const unsubAvail = window.electronAPI?.onUpdateAvailable?.((data: any) => {
      if (isMac) setInfo(data);
    });

    return () => {
      if (typeof unsub === "function") unsub();
      if (typeof unsubAvail === "function") unsubAvail();
    };
  }, [isMac]);

  const handleAction = () => {
    if (isMac) {
      // 🍎 CAMINO MAC: Abrir navegador y descargar a mano
      // Usamos la API que vi en tu preload: window.api.openExternal
      // CHEQUEÁ QUE ESTE LINK SEA EL DE TU REPO:
      window.api?.openExternal(
        "https://github.com/code-arr/Aplicacion-estudio-juridico/releases/latest"
      );
      setInfo(null); // Cerramos el modal
    } else {
      // 🪟 CAMINO WINDOWS: Instalación automática con spinner
      setIsInstalling(true);
      setTimeout(() => {
        window.electronAPI?.installUpdate();
      }, 150);
    }
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
              ¡Actualización disponible!
            </h2>
            <p className="text-gray-500">Versión {info?.version}</p>
          </div>
        </div>

        {/* Texto dinámico según SO */}
        <div className="mb-8">
          <p className="text-lg text-gray-600">
            {isMac ? (
              <>
                Para actualizar en Mac, por favor descargá la nueva versión
                desde nuestra web.
                <br />
                <span className="text-sm text-gray-400">
                  (Limitación de seguridad de Apple)
                </span>
              </>
            ) : (
              <>
                Se ha descargado la versión{" "}
                <span className="font-bold text-gray-900">{info?.version}</span>
                .
                <br />
                ¿Querés instalarla y reiniciar ahora?
              </>
            )}
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            disabled={isInstalling}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            onClick={() => setInfo(null)}
          >
            Más tarde
          </button>

          <button
            disabled={isInstalling}
            className={`px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-all flex items-center gap-2 
              ${isInstalling ? "opacity-80 cursor-wait" : "hover:bg-blue-700"}
            `}
            onClick={handleAction}
          >
            {isInstalling ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Preparando...
              </>
            ) : isMac ? (
              <>
                <ExternalLink size={20} />
                Descargar DMG
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
