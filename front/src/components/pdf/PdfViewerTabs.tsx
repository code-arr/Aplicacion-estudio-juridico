import type { OpenDoc } from "@/types/Document";
import { usePdfManagerStore } from "@/store/usePdfManagerStore";
import PdfTabBar from "./PdfTabBar";
import PdfPane from "./PdfPane";

type FitMode = "actual" | "fitWidth" | "fitPage";

type PdfViewerTabsProps = {
  fitMode: FitMode;
  zoom: number;
};

const PdfViewerTabs = ({ fitMode, zoom }: PdfViewerTabsProps) => {
  const { openDocs, activeDoc, setActiveDoc, close } = usePdfManagerStore();

  if (!openDocs.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        No hay documentos abiertos
      </div>
    );
  }

  // Buscamos el doc activo una sola vez
  const activeDocument: OpenDoc | undefined = openDocs.find(
    (d) => d.id === activeDoc?.id
  );

  // Wrapper: de id -> setActiveDoc(id, clientId)
  const handleSelect = (id: string) => {
    const found = openDocs.find((d) => d.id === id);
    if (!found) return; // sanity check
    setActiveDoc(id, found.clientId); // ✅ ahora pasás el clientId correcto
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Barra de pestañas */}
      <PdfTabBar
        docs={openDocs}
        activeDocId={activeDoc ? activeDoc.id : null}
        onSelect={handleSelect}
        onClose={close}
      />

      {/* Renderiza solo el documento activo (si existe) */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">
        {activeDocument ? (
          <PdfPane doc={activeDocument} fitMode={fitMode} zoom={zoom} />
        ) : null}
      </div>
    </div>
  );
};

export default PdfViewerTabs;
