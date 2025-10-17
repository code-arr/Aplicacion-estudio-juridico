// src/components/pdf/PdfPane.tsx
import { useEffect, useRef } from "react";
import PdfCanvas from "./PdfCanvas";
/* import AnnotationOverlay from "./AnnotationOverlay"; */
import type { OpenDoc } from "@/types/Document";

type PdfPaneProps = {
  doc: OpenDoc; // <- ahora recibe el doc completo
  fitMode: "actual" | "fitWidth" | "fitPage";
  zoom: number; // 1 = 100%
};

const PdfPane = ({ doc, fitMode, zoom }: PdfPaneProps) => {
  // Escucha mouse/teclas/scroll/visibilidad
  /* useDocumentActivityListeners(); */

  const containerRef = useRef<HTMLDivElement>(null);

  // Si esta vista es la activa, el padre solo renderiza ésta, así que no necesitamos isActive.
  useEffect(() => {
    containerRef.current?.focus();
  }, [doc?.id]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="flex flex-col h-full w-full outline-none"
    >
      {/* Contenedor principal: PDF + anotaciones */}
      <div className="relative flex-1 overflow-auto bg-gray-100">
        {/* Pasamos ambas fuentes de ser posible; PdfCanvas elige una */}
        <PdfCanvas url={doc.url} fitMode={fitMode} scale={zoom} />
        {/* <AnnotationOverlay docId={doc.id} /> */}
        {/* <TimeBadge /> */} {/* badge informativo arriba a la derecha */}
      </div>
    </div>
  );
};

export default PdfPane;
