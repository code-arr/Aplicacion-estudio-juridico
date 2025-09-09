import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import PdfTopBar from "@/components/pdf/PdfTopBar";
import PdfViewerTabs from "@/components/pdf/PdfViewerTabs";
import { usePdfManagerStore } from "@/store/usePdfManagerStore";
import { useDocumentStore } from "@/store/useDocumentStore";
import type { Document as AppDocument } from "@/types/Document";

type FitMode = "actual" | "fitWidth" | "fitPage";

/** [B] Utilidad: docIds y active desde la URL (fallback, no obligatorio) */
function useDocIdsFromQuery() {
  const { search } = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(search);
    const raw = params.get("docIds")?.trim() ?? "";
    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const active = params.get("active")?.trim() || null;
    return { ids, active };
  }, [search]);
}

const DocumentViewerPage = () => {
  const [fitMode, setFitMode] = useState<FitMode>("fitPage"); // tamaño original
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const { ids, active } = useDocIdsFromQuery();

  // [C] Stores
  const documentsByClientItem = useDocumentStore(
    (s) => s.documentsByClientItem
  );
  const setPool = useDocumentStore((s) => s.setDocumentsByClientItem);

  const open = usePdfManagerStore((s) => s.open);
  const setActiveDocId = usePdfManagerStore((s) => s.setActiveDocId);
  const openDocs = usePdfManagerStore((s) => s.openDocs);
  const activeDocId = usePdfManagerStore((s) => s.activeDocId);

  const idsKey = useMemo(() => ids.join(","), [ids]);

  /* [D] Función única para aplicar cualquier payload entrante (IPC o URL) */
  const applyPayload = (payload: {
    docs: AppDocument[];
    activeId?: string | null;
  }) => {
    if (!payload || !Array.isArray(payload.docs) || payload.docs.length === 0)
      return;
    const { docs, activeId } = payload;

    // D1) Fusionar docs al pool local (por id)
    const curr = useDocumentStore.getState().documentsByClientItem;
    const map = new Map(curr.map((d) => [d.id, d]));
    for (const d of docs) map.set(d.id, d);
    setPool(Array.from(map.values()));

    // D2) Abrir SOLO PDFs que falten
    const pdfs = docs.filter((d) => (d.type || "").toLowerCase() === "pdf");
    if (pdfs.length) {
      const already = new Set(
        usePdfManagerStore.getState().openDocs.map((d) => d.id)
      );
      pdfs
        .filter((d) => !already.has(d.id))
        .forEach((d) => open({ id: d.id, title: d.name, url: d.fileUrl }));
    }

    // D3) Activar pestaña si corresponde y es PDF válido
    if (activeId && pdfs.some((d) => d.id === activeId)) {
      usePdfManagerStore.getState().setActiveDocId(activeId);
    }
  };

  /* [E] Suscripción a viewer:addDocs una sola vez (con useRef anticarrera)
        - Si implementaste el “buffer + replay” en preload, esto ATRAPA SIEMPRE el primer payload
        - Llamamos opcionalmente a window.viewer.ready() por si implementaste handshake en main  */
  const subscribedRef = useRef(false);
  useEffect(() => {
    if (subscribedRef.current) return; // evita doble suscripción accidental
    subscribedRef.current = true;

    // Aviso opcional de “estoy listo” (si lo tenés en preload/main):
    /* window.viewer?.ready?.(); */

    // Si no existe el puente, no hay nada que hacer
    if (!window.viewer?.onAddDocs) return;

    const off = window.viewer.onAddDocs((payload) => {
      // console.log("[viewer] payload recibido:", payload);
      applyPayload(payload);
    });

    return () => {
      subscribedRef.current = false;
      off?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* [F] Fallback: si hay docIds en la URL, intentar resolverlos del pool actual */
  useEffect(() => {
    if (!ids.length) return;

    const poolById = new Map<string, AppDocument>(
      documentsByClientItem.map((d) => [d.id, d])
    );

    const resolved = ids
      .map((id) => poolById.get(id))
      .filter(Boolean) as AppDocument[];
    const pdfs = resolved.filter((d) => (d.type || "").toLowerCase() === "pdf");
    if (!pdfs.length) return;

    const alreadyOpen = new Set(
      usePdfManagerStore.getState().openDocs.map((d) => d.id)
    );
    pdfs
      .filter((d) => !alreadyOpen.has(d.id))
      .forEach((d) => open({ id: d.id, title: d.name, url: d.fileUrl }));

    const nextActive =
      (active && pdfs.find((d) => d.id === active)?.id) || pdfs[0]?.id || null;

    const currentActive = usePdfManagerStore.getState().activeDocId;
    if (nextActive !== currentActive) setActiveDocId(nextActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, active, documentsByClientItem]);

  /* [G] Cuando no queden pestañas abiertas, cerrar la ventana del visor */
  useEffect(() => {
    const unsub = usePdfManagerStore.subscribe((s) => {
      if (s.openDocs.length === 0) {
        window.viewer?.close?.();
        try {
          window.close();
        } catch {
          // no importa
        }
      }
    });
    return () => unsub();
  }, []);

  // [H] UI: si aún no hay nada abierto, mostramos “esperando” (no bloqueamos por falta de docIds)
  const nothingOpen = openDocs.length === 0;

  const zoomIn = () => setZoom((z) => Math.min(4, +(z * 1.1).toFixed(3)));
  const zoomOut = () => setZoom((z) => Math.max(0.1, +(z / 1.1).toFixed(3)));
  const resetZoom = () => setZoom(1);

  const handleClose = () => {
    // Si necesitás flushear actividad del doc activo, hacelo acá antes:
    // usePdfSessionStore.getState().flushRemainder(activeDocId ?? undefined);
    window.close();
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <PdfTopBar
        docId={activeDocId ?? null}
        docName={openDocs.find((doc) => doc.id === activeDocId)?.title ?? null}
        onClose={handleClose}
        fitMode={fitMode}
        onFitModeChange={setFitMode}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
      />

      <div className="flex-1 min-h-0">
        {nothingOpen ? (
          <div className="h-full w-full grid place-items-center text-gray-500 px-6 text-center">
            Esperando documentos del visor…
            <div className="mt-2 text-xs opacity-70">
              (si abriste desde “Ver” y no aparece, verificá el buffer en{" "}
              <code>preload</code> o el handshake <code>viewer.ready()</code>)
            </div>
          </div>
        ) : (
          <PdfViewerTabs fitMode={fitMode} zoom={zoom} />
        )}
      </div>
    </div>
  );
};

export default DocumentViewerPage;
