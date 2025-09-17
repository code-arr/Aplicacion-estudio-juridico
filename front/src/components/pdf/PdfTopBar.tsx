// src/components/pdf/PdfTopBar.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Save, Clock, PenTool } from "lucide-react";

type FitMode = "actual" | "fitWidth" | "fitPage";

type PdfTopBarProps = {
  docId: string | null;
  docName: string | null;
  onClose: () => void;

  // --- NUEVO (opcionales) ---
  fitMode?: FitMode;
  onFitModeChange?: (m: FitMode) => void;
  zoom?: number; // 1 = 100%
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;

  readOnly?: boolean; // por si mañana agregás "Editar", "Anotar", etc.
};

export default function PdfTopBar({
  docId,
  docName,
  onClose,
  fitMode = "fitPage",
  onFitModeChange,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: PdfTopBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
      <div className="text-lg capitalize text-gray-900 truncate flex-1">
        {/* Doc: <span className="font-medium">{docId ?? "—"}</span> */}
        <span className="font-medium">{docName ?? "—"}</span>
      </div>

      {/* --- Controles de ajuste --- */}
      <div className="hidden md:flex items-center gap-1">
        <button
          className={`px-2 py-1 rounded ${
            fitMode === "actual" ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          onClick={() => onFitModeChange?.("actual")}
          title="Tamaño original (100%)"
        >
          100%
        </button>
        <button
          className={`px-2 py-1 rounded ${
            fitMode === "fitWidth" ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          onClick={() => onFitModeChange?.("fitWidth")}
          title="Ajustar al ancho"
        >
          Ancho
        </button>
        <button
          className={`px-2 py-1 rounded ${
            fitMode === "fitPage" ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          onClick={() => onFitModeChange?.("fitPage")}
          title="Página completa"
        >
          Página
        </button>
      </div>

      {/* --- Zoom --- */}
      <div className="flex items-center gap-1">
        <button
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={onZoomOut}
          title="Acercar (-)"
        >
          <ZoomOut />
        </button>
        <div className="min-w-12 text-center text-sm tabular-nums">
          {Math.round(zoom * 100)}%
        </div>
        <button
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={onZoomIn}
          title="Alejar (+)"
        >
          <ZoomIn />
        </button>
        <button
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={onZoomReset}
          title="Restaurar 100%"
        >
          <RotateCcw />
        </button>
      </div>

      <button
        className="ml-2 px-3 py-1 rounded hover:bg-gray-100"
        onClick={onClose}
      >
        Cerrar
      </button>
    </div>
  );
}
