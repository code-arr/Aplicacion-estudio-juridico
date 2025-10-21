// src/pages/dashboard/audiences/AudienceViewerPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Audience } from "@/types/Audience";
import type { Trackable } from "@/types/Timer";
import { useAuthStore } from "@/store/useAuthStore";
import { usePdfManagerStore } from "@/store/usePdfManagerStore";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useAudienceStore } from "@/store/useAudienceStore";
import { audienceToOpenDoc } from "@/store/useAudienceStore";
import PdfTopBar from "@/components/pdf/PdfTopBar";
import PdfViewerTabs from "@/components/pdf/PdfViewerTabs";
import { useTimeSyncInit } from "@/hooks/useTimeSyncInit";
import { useActivityHeartbeat } from "@/hooks/useActivityHeartbeat";
import { useAppPresenceTimer } from "@/hooks/useAppPresenceTimer";
import { useFocusContext } from "@/hooks/useFocusContext";

type FitMode = "actual" | "fitWidth" | "fitPage";

function useAudIdsFromQuery() {
  const { search } = useLocation();
  return useMemo(() => {
    const p = new URLSearchParams(search);
    const ids = (p.get("audIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const active = p.get("active")?.trim() || null;
    return { ids, active };
  }, [search]);
}

export default function AudienceViewerPage() {
  const user = useAuthStore((s) => s.user);
  const lawyerId = useLawyerStore((s) => s.lawyer?.id);
  const timersEnabled = !!lawyerId && user?.role !== "admin";

  useTimeSyncInit(); // ✅ suscribirse al mirror
  useActivityHeartbeat({ enabled: timersEnabled });
  useAppPresenceTimer(timersEnabled);

  const [fitMode, setFitMode] = useState<FitMode>("fitPage");
  const [zoom, setZoom] = useState(1);
  const { ids, active } = useAudIdsFromQuery();
  const idsKey = useMemo(() => ids.join(","), [ids]);

  // === Store (mismo patrón que DocumentViewerPage) ===
  const audiencesByClientItem = useAudienceStore(
    (s) => s.audiencesByClientItem
  );
  const open = usePdfManagerStore((s) => s.open);
  const setActiveDoc = usePdfManagerStore((s) => s.setActiveDoc);
  const openDocs = usePdfManagerStore((s) => s.openDocs);
  const activeDoc = usePdfManagerStore((s) => s.activeDoc);

  // Contexto = Audiencia activo
  useFocusContext(
    activeDoc?.id
      ? ({
          type: "Audience",
          id: activeDoc.id,
          clientId: activeDoc.clientId,
        } as Trackable)
      : null
  );

  // --- IPC applyPayload: { audiences, activeId } ---
  const applyPayload = (payload: {
    audiences: Audience[];
    activeId?: string | null;
  }) => {
    if (!payload?.audiences?.length) return;
    const { audiences, activeId } = payload;

    const already = new Set(
      usePdfManagerStore.getState().openDocs.map((d) => d.id)
    );
    audiences
      .map(audienceToOpenDoc)
      .filter((d) => !already.has(d.id))
      .forEach((d) =>
        open({ id: d.id, title: d.name, url: d.url, clientId: d.clientId })
      );

    if (activeId) setActiveDoc(activeId, null);
  };

  // --- Suscripción a IPC propio de audiencias ---
  const subscribedRef = useRef(false);
  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    if (!window.audienceViewer?.onAddDocs) return;
    const off = window.audienceViewer.onAddDocs(applyPayload);
    return () => {
      subscribedRef.current = false;
      off?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fallback por URL (idéntico a tu [F] de documentos) ---
  useEffect(() => {
    if (!ids.length) return;

    const poolById = new Map(audiencesByClientItem.map((a) => [a.id, a]));
    const resolved = ids
      .map((id) => poolById.get(id))
      .filter(Boolean) as Audience[];
    if (!resolved.length) return;

    const alreadyOpen = new Set(
      usePdfManagerStore.getState().openDocs.map((d) => d.id)
    );
    resolved
      .map(audienceToOpenDoc)
      .filter((d) => !alreadyOpen.has(d.id))
      .forEach((d) =>
        open({ id: d.id, title: d.name, url: d.url, clientId: d.clientId })
      );

    const nextActive =
      (active && `aud:${active}`) ||
      (resolved[0] ? `aud:${resolved[0].id}` : null);
    const currentActive = usePdfManagerStore.getState().activeDoc?.id;
    if (nextActive !== currentActive) setActiveDoc(nextActive, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, active, audiencesByClientItem, open, setActiveDoc]);

  // --- Cerrar ventana si no quedan tabs ---
  useEffect(() => {
    const unsub = usePdfManagerStore.subscribe((s) => {
      if (s.openDocs.length === 0) {
        window.audienceViewer?.close?.();
        try {
          window.close();
        } catch {
          // no importa
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const off = window.audienceViewer?.onCloseById?.((id: string) => {
      usePdfManagerStore.getState().close(id);
    });
    return () => off?.();
  }, []);

  // UI igual
  const nothingOpen = openDocs.length === 0;
  const zoomIn = () => setZoom((z) => Math.min(4, +(z * 1.1).toFixed(3)));
  const zoomOut = () => setZoom((z) => Math.max(0.1, +(z / 1.1).toFixed(3)));
  const resetZoom = () => setZoom(1);
  const handleClose = () => window.close();

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <PdfTopBar
        docId={activeDoc?.id ?? null}
        docName={openDocs.find((d) => d.id === activeDoc?.id)?.title ?? null}
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
            Esperando audiencias…
          </div>
        ) : (
          <PdfViewerTabs fitMode={fitMode} zoom={zoom} />
        )}
      </div>
    </div>
  );
}
