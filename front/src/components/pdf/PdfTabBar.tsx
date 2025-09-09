import { useEffect, useRef } from "react";
import { usePdfManagerStore } from "@/store/usePdfManagerStore";

type DocTab = {
  id: string;
  title: string;
};

type PdfTabBarProps = {
  docs: DocTab[];
  activeDocId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  className?: string;
};

export default function PdfTabBar({
  docs,
  activeDocId,
  onSelect,
  onClose,
}: /*   className = "", */
PdfTabBarProps) {
  /* const containerRef = useRef<HTMLDivElement | null>(null); */
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Mantener el mapa estable entre renders
  const setItemRef = (id: string) => (el: HTMLButtonElement | null) => {
    if (!el) {
      itemRefs.current.delete(id);
    } else {
      itemRefs.current.set(id, el);
    }
  };

  // Cuando cambia la activa, scrollearla a la vista
  useEffect(() => {
    if (!activeDocId) return;
    const el = itemRefs.current.get(activeDocId);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeDocId]);

  // Teclas izquierda/derecha para moverte entre pestañas (opcional, simple)
  function onKeyDown(e: React.KeyboardEvent) {
    if (docs.length === 0) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    e.preventDefault();
    const idx = Math.max(
      0,
      docs.findIndex((d) => d.id === activeDocId)
    );
    const nextIdx =
      e.key === "ArrowRight"
        ? (idx + 1) % docs.length
        : (idx - 1 + docs.length) % docs.length;

    onSelect(docs[nextIdx].id);
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 border-b bg-white">
      {docs.map((doc) => {
        const isActive = doc.id === activeDocId;
        return (
          <button
            key={doc.id}
            ref={setItemRef(doc.id)}
            onClick={() => onSelect(doc.id)}
            className={`group flex items-center gap-2 rounded-lg px-3 py-1.5 border
              ${
                isActive
                  ? "bg-gray-100 border-gray-300"
                  : "bg-white border-transparent hover:bg-gray-50"
              }`}
            title={doc.title}
          >
            <span className="truncate max-w-[200px]">{doc.title}</span>

            {/* ✕ cerrar pestaña */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onClose(doc.id);
              }}
              className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 text-gray-500"
              title="Cerrar"
            >
              ✕
            </span>
          </button>
        );
      })}
    </div>
  );
}
