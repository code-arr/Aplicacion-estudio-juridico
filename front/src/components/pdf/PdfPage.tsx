// src/components/pdf/PdfPage.tsx
import { memo, useCallback, useEffect, useRef } from "react";
import type {
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";
import { computeBaseScale, type FitMode } from "@/utils/pdfScale";

export type GetPageFn = (n: number) => Promise<PDFPageProxy>;

type PdfPageProps = {
  getPage: GetPageFn;
  pageNum: number;
  scaleValue: number;
  rotation: 0 | 90 | 180 | 270;
  fitModeValue: FitMode;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  dpr: number;
  renderTick?: number;
};

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

const Inner = ({
  getPage,
  pageNum,
  scaleValue,
  rotation,
  fitModeValue,
  containerRef,
  dpr,
  renderTick,
}: PdfPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<RenderTask | null>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let page: PDFPageProxy;
    try {
      page = await getPage(pageNum);
    } catch {
      // opcional: placeholder de error
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#c00";
        ctx.font = "14px sans-serif";
        ctx.fillText("No se pudo cargar la página.", 12, 24);
      }
      return;
    }

    const container = containerRef.current;
    const base = container
      ? computeBaseScale(page, container, rotation, fitModeValue)
      : 1;
    const finalScale = Math.max(0.1, base * scaleValue);
    const viewport = page.getViewport({ scale: finalScale, rotation });

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Tamaño CSS (para layout) y buffer físico (HiDPI)
    const cssW = Math.floor(viewport.width);
    const cssH = Math.floor(viewport.height);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));

    // cancelar render anterior, preparar HiDPI, limpiar
    taskRef.current?.cancel();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // pintar
    const renderTask = page.render({ canvasContext: ctx, viewport });
    taskRef.current = renderTask;
    try {
      await renderTask.promise;
    } catch {
      // cancelado -> ignorar
    } finally {
      if (taskRef.current === renderTask) taskRef.current = null;
    }
  }, [getPage, pageNum, rotation, containerRef, fitModeValue, scaleValue, dpr]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await render();
    })();
    return () => {
      cancelled = true;
      taskRef.current?.cancel();
    };
  }, [render]);

  useEffect(() => {
    // fuerza repaint cuando cambia el tick
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick]);

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        style={{
          background: "white",
          willChange: "transform",
          contain: "content",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          borderRadius: 4,
        }}
      />
    </div>
  );
};

// Comparador para evitar renders innecesarios
function arePropsEqual(prev: PdfPageProps, next: PdfPageProps) {
  if (prev.getPage !== next.getPage) return false;
  if (prev.pageNum !== next.pageNum) return false;
  if (prev.rotation !== next.rotation) return false;
  if (prev.fitModeValue !== next.fitModeValue) return false;
  if (prev.containerRef !== next.containerRef) return false;
  if (prev.dpr !== next.dpr) return false;
  // redondeo scale para evitar jitter de floats
  if (round3(prev.scaleValue) !== round3(next.scaleValue)) return false;
  // renderTick explícitamente fuerza repintado cuando cambie
  if (prev.renderTick !== next.renderTick) return false;
  return true;
}

export default memo(Inner, arePropsEqual);
