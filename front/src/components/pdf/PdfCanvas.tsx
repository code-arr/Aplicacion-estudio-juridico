// src/components/pdf/PdfCanvas.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

// 1) Runtime
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// 2) Tipos
import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from "pdfjs-dist/types/src/display/api";

// 3) Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// 4) Nuevos imports
import PdfPage from "./PdfPage";
import {
  computeBaseScale,
  type FitMode,
  CONTENT_PADDING_PX,
} from "@/utils/pdfScale";

// ===== Props & Handle =====
export type PdfCanvasProps = {
  url?: string;
  file?: string | Uint8Array | ArrayBuffer;
  /** Multiplicador de zoom del usuario (1 = 100%). Se aplica sobre el modo de ajuste. */
  scale?: number;
  rotation?: 0 | 90 | 180 | 270;
  className?: string;
  onDocReady?: (meta: { numPages: number }) => void;
  onPageChange?: (pageNum: number) => void;
  activePage?: number | null;
  fitMode?: FitMode;
};

export type PdfCanvasHandle = {
  scrollToPage: (page: number) => void;
  rerenderVisible: () => void;
  /** Zoom relativo (por ejemplo 1.1 o 0.9) */
  setScale: (s: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

const DEFAULT_FIT_MODE: FitMode = "actual";

const PdfCanvas = forwardRef<PdfCanvasHandle, PdfCanvasProps>(
  function PdfCanvas(
    {
      url,
      file,
      scale = 1,
      rotation = 0,
      className,
      onDocReady,
      onPageChange,
      activePage,
      fitMode = DEFAULT_FIT_MODE,
    },
    ref
  ) {
    // ===== Refs y estado =====
    const parentRef = useRef<HTMLDivElement | null>(null);
    const pdfRef = useRef<PDFDocumentProxy | null>(null);
    const pageCacheRef = useRef<Map<number, Promise<PDFPageProxy>>>(new Map());
    const [numPages, setNumPages] = useState<number>(0);
    const [renderTick, setRenderTick] = useState(0);

    // modo de ajuste y zoom del usuario como refs (para no forzar renders)
    const fitModeRef = useRef<FitMode>(fitMode);
    const userZoomRef = useRef<number>(scale);

    // estimación de altura (se corrige luego con measure)
    const [pageHeight, setPageHeight] = useState<number>(1000);

    // DPR para nitidez
    const dpr = useMemo(
      () => (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1),
      []
    );

    // ===== cargar documento =====
    useEffect(() => {
      let cancelled = false;

      // 👇 capturamos la referencia actual del cache en una variable local
      const cache = pageCacheRef.current;

      async function load() {
        pdfRef.current = null;
        cache.clear(); // usamos la variable local, no pageCacheRef.current
        setNumPages(0);

        if (!file && !url) return;

        const src = file
          ? typeof file === "string"
            ? { url: file }
            : { data: file instanceof Uint8Array ? file : new Uint8Array(file) }
          : (url as string);

        const task = pdfjsLib.getDocument(src);
        try {
          const pdf = await task.promise;
          if (cancelled) return;
          pdfRef.current = pdf;
          setNumPages(pdf.numPages);
          onDocReady?.({ numPages: pdf.numPages });

          // Medimos la página 1 para estimar altura inicial según fitMode + scale
          const container = parentRef.current;
          if (!container) return;
          const page1 = await pdf.getPage(1);
          const base = computeBaseScale(
            page1,
            container,
            rotation,
            fitModeRef.current
          );
          const finalScale = Math.max(0.1, base * userZoomRef.current);
          const v1 = page1.getViewport({ scale: finalScale, rotation });
          setPageHeight(Math.ceil(v1.height));
        } catch (e) {
          console.error("No se pudo cargar el PDF:", e);
        }
      }

      load();

      return () => {
        cancelled = true;
        pdfRef.current = null;
        cache.clear(); // 👈 limpiamos usando la misma referencia capturada
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, url, rotation, onDocReady]);

    // ===== mantener refs en sync =====
    useEffect(() => {
      userZoomRef.current = scale;
    }, [scale]);

    useEffect(() => {
      fitModeRef.current = fitMode ?? DEFAULT_FIT_MODE;
    }, [fitMode]);

    // ===== cache de páginas =====
    const getPageCached = useCallback(async (n: number) => {
      const pdf = pdfRef.current;
      if (!pdf) throw new Error("PDF no cargado");
      let p = pageCacheRef.current.get(n);
      if (!p) {
        p = pdf.getPage(n);
        pageCacheRef.current.set(n, p);
      }
      return p;
    }, []);

    // ===== virtualizer =====
    const virtualizer = useVirtualizer({
      count: numPages || 0,
      getScrollElement: () => parentRef.current,
      estimateSize: () => pageHeight,
      overscan: 6,
    });

    // notificar página “más centrada” al scrollear
    useEffect(() => {
      if (!onPageChange || !parentRef.current) return;
      const el = parentRef.current;
      const handler = () => {
        const mid = el.scrollTop + el.clientHeight / 2;
        const items = virtualizer.getVirtualItems();
        let best = items[0];
        for (const it of items) {
          if (it.start <= mid && mid < it.end) {
            best = it;
            break;
          }
        }
        onPageChange(best ? best.index + 1 : 1);
      };
      handler();
      const r = () => requestAnimationFrame(handler);
      el.addEventListener("scroll", r, { passive: true });
      return () => el.removeEventListener("scroll", r);
    }, [onPageChange, virtualizer]);

    // al cambiar tamaño del contenedor, re-estimamos altura base con página 1
    useEffect(() => {
      const el = parentRef.current;
      if (!el || !pdfRef.current) return;
      const ro = new ResizeObserver(async () => {
        try {
          const pdf = pdfRef.current!;
          if (pdf.numPages === 0) return;
          const p1 = await pdf.getPage(1);
          const base = computeBaseScale(p1, el, rotation, fitModeRef.current);
          const finalScale = Math.max(0.1, base * userZoomRef.current);
          const v = p1.getViewport({ scale: finalScale, rotation });
          setPageHeight(Math.ceil(v.height));
          virtualizer.measure();
        } catch {
          // ignorar
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [rotation, virtualizer]);

    // ===== API imperativa =====
    useImperativeHandle(
      ref,
      () => ({
        scrollToPage: (page: number) => {
          const idx = Math.max(0, Math.min((numPages || 1) - 1, page - 1));
          virtualizer.scrollToIndex(idx, { align: "center" });
        },
        rerenderVisible: () => {
          virtualizer.measure();
          setRenderTick((t) => t + 1);
        },
        setScale: (s: number) => {
          userZoomRef.current = Math.max(0.1, s);
          virtualizer.measure();
          setRenderTick((t) => t + 1);
        },
        zoomIn: () => {
          userZoomRef.current = Math.min(4, userZoomRef.current * 1.1);
          virtualizer.measure();
          setRenderTick((t) => t + 1);
        },
        zoomOut: () => {
          userZoomRef.current = Math.max(0.1, userZoomRef.current / 1.1);
          virtualizer.measure();
          setRenderTick((t) => t + 1);
        },
      }),
      [numPages, virtualizer]
    );

    // sync externos => re-medir y re-render
    useEffect(() => {
      userZoomRef.current = scale;
      setRenderTick((t) => t + 1);
      virtualizer.measure();
    }, [scale, virtualizer]);

    useEffect(() => {
      fitModeRef.current = fitMode ?? DEFAULT_FIT_MODE;
      setRenderTick((t) => t + 1);
      virtualizer.measure();
    }, [fitMode, virtualizer]);

    // scroll programático cuando cambia activePage
    useEffect(() => {
      if (!activePage) return;
      const idx = Math.max(0, Math.min((numPages || 1) - 1, activePage - 1));
      virtualizer.scrollToIndex(idx, { align: "center" });
    }, [activePage, numPages, virtualizer]);

    // ===== Render =====
    return (
      <div
        ref={parentRef}
        className={
          "relative overflow-auto h-full w-full bg-neutral-100 " +
          (className ?? "")
        }
        style={{
          padding: `${CONTENT_PADDING_PX}px`,
          scrollSnapType: "y proximity",
        }}
      >
        {/* espacio total virtual */}
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((item) => (
            <div
              key={item.key}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${item.start}px)`,
                padding: "16px 0",
              }}
            >
              <PdfPage
                getPage={getPageCached}
                pageNum={item.index + 1}
                scaleValue={userZoomRef.current}
                rotation={rotation}
                fitModeValue={fitModeRef.current}
                containerRef={parentRef}
                dpr={dpr}
                renderTick={renderTick}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default PdfCanvas;
