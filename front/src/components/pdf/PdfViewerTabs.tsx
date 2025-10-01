import type { OpenDoc } from "@/types/Document";
import { usePdfManagerStore } from "@/store/usePdfManagerStore";
import PdfTabBar from "./PdfTabBar";
import PdfPane from "./PdfPane";

type FitMode = "actual" | "fitWidth" | "fitPage";

type PdfViewerTabsProps = {
  fitMode: FitMode;
  zoom: number;
};

/* function useAutoTrackActiveDocument() {
  const activeDocId = usePdfManagerStore((s) => s.activeDocId);
  const switchTo = useTimerStore((s) => s.switchTo);
  const pause = useTimerStore((s) => s.pause);

  useEffect(() => {
    if (activeDocId) {
      switchTo({ type: "Document", id: activeDocId }).catch(console.error);
    } else {
      // No hay doc activo => cerramos el timer si estuviera corriendo
      pause("close").catch(() => {});
    }
  }, [activeDocId, switchTo, pause]);
} */

const PdfViewerTabs = ({ fitMode, zoom }: PdfViewerTabsProps) => {
  const { openDocs, activeDocId, setActiveDocId, close } = usePdfManagerStore();

  if (!openDocs.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        No hay documentos abiertos
      </div>
    );
  }

  // Buscamos el doc activo una sola vez
  const activeDoc: OpenDoc | undefined = openDocs.find(
    (d) => d.id === activeDocId
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Barra de pestañas */}
      <PdfTabBar
        docs={openDocs}
        activeDocId={activeDocId}
        onSelect={setActiveDocId}
        onClose={close}
      />

      {/* Renderiza solo el documento activo (si existe) */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">
        {activeDoc ? (
          <PdfPane doc={activeDoc} fitMode={fitMode} zoom={zoom} />
        ) : null}
      </div>
    </div>
  );
};

export default PdfViewerTabs;
