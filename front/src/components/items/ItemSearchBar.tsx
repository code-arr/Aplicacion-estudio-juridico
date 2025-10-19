// src/components/items/ItemSearchBar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { ClientItem } from "@/types/ClientItem";
import { Search } from "lucide-react";

type Props = {
  items: ClientItem[] | null;
  onSelect: (item: ClientItem) => void;
  placeholder?: string;
  limit?: number; // default 4
};

export function ItemsSearchBar({
  items,
  onSelect,
  placeholder = "Buscar por ítem…",
  limit = 4,
}: Props) {
  const data = useMemo(() => items ?? [], [items]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // debounce suave para no filtrar en cada tecla
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 120);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    if (!debounced) return [];
    return data
      .filter((it) => it.title?.toLowerCase().includes(debounced))
      .slice(0, limit);
  }, [debounced, data, limit]);

  // abrir/cerrar
  useEffect(() => {
    setOpen(Boolean(debounced) && (results.length > 0 || data.length === 0));
    setActive(0);
  }, [debounced, results.length, data.length]);

  // click afuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(results.length > 0);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && results[active]) {
        onSelect(results[active]);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(results.length > 0)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="pl-10 w-full h-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
        />
      </div>

      {/* dropdown: mismo ancho que el input */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md overflow-hidden">
          <ul className="max-h-80 overflow-auto">
            {data.length === 0 && debounced ? (
              <li className="px-3 py-2 text-sm text-gray-500">
                Aún no hay ítems para este cliente
              </li>
            ) : results.length === 0 && debounced ? (
              <li className="px-3 py-2 text-sm text-gray-500">
                Sin resultados
              </li>
            ) : (
              results.map((it, i) => (
                <li key={it.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(it);
                      setOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 hover:bg-gray-50 ${
                      i === active ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-[hsl(225,15%,15%)] capitalize">
                        {it.title}
                      </span>
                      {it.status && (
                        <span className="ml-auto text-xs text-gray-500 capitalize">
                          {it.status}
                        </span>
                      )}
                    </div>
                    {it.description && (
                      <p className="text-xs text-gray-500 truncate capitalize">
                        {it.description}
                      </p>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
