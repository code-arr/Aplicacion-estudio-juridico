// src/components/items/ClientItemEditModal.tsx
import { useEffect, useMemo, useState } from "react";
import type { ClientItem } from "@/types/ClientItem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCatalogStore } from "@/store/useCatalogStore";
import { updateClientItem } from "@/api/clientItem";

type ItemStatus = "open" | "on_hold" | "closed";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: ClientItem;
  onSaved?: (updated: ClientItem) => void;
};

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "open", label: "Abierto" },
  { value: "on_hold", label: "En pausa" },
  { value: "closed", label: "Cerrado" },
];

const NONE = "__none__";

export default function ClientItemEditModal({
  open,
  onOpenChange,
  item,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(item.title ?? "");
  const [status, setStatus] = useState<ItemStatus>(
    (item.status as ItemStatus) ?? "open"
  );
  const [categoryId, setCategoryId] = useState<string | undefined>(
    item.categoryId
  );
  const [sectionId, setSectionId] = useState<string | undefined>(
    item.sectionId
  );
  const [itemTypeId, setItemTypeId] = useState<string | undefined>(
    item.itemTypeId
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(item.private ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Traigo catálogo crudo (puede venir undefined)
  const rawCategories = useCatalogStore((s) => s.categories);
  const rawSections = useCatalogStore((s) => s.sections);
  const rawItemTypes = useCatalogStore((s) => s.itemTypes);

  // Normalizo dentro del memo → no cambia la identidad en cada render
  const categories = useMemo(() => rawCategories ?? [], [rawCategories]);
  const sections = useMemo(() => rawSections ?? [], [rawSections]);
  const itemTypes = useMemo(() => rawItemTypes ?? [], [rawItemTypes]);

  // Si tus sections están asociadas a una categoría, filtrá acá.
  const sectionsFiltered = useMemo(() => {
    if (!categoryId) return sections;
    // Si Section tiene categoryId:
    return sections.filter(
      (s: any) => !s.categoryId || s.categoryId === categoryId
    );
  }, [sections, categoryId]); // ✅ deps estables

  useEffect(() => {
    setTitle(item.title ?? "");
    setStatus((item.status as ItemStatus) ?? "open");
    setCategoryId(item.categoryId);
    setSectionId(item.sectionId);
    setItemTypeId(item.itemTypeId);
    setIsPrivate(item.private ?? false); // ✅
    setError(null);
    setSaving(false);
  }, [item, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item.id) return;
    if (!title.trim()) return setError("El título es requerido");

    setSaving(true);
    setError(null);
    try {
      const payload: Partial<ClientItem> = {
        title: title.trim(),
        status,
        categoryId: categoryId || undefined,
        sectionId: sectionId || undefined,
        itemTypeId: itemTypeId || undefined,
        private: isPrivate, // ✅ agregado
      };
      const updated = await updateClientItem(item.id, payload);
      onSaved?.(updated);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo actualizar el item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
          <DialogDescription>
            Actualizá los datos del item seleccionado.
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-client-item-form"
          onSubmit={handleSubmit}
          className="grid gap-4 pt-2"
        >
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ItemStatus)} // ✅ castea string → union
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccioná estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={categoryId ?? ""}
              onValueChange={(v) => setCategoryId(v || undefined)} // "" → undefined
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id!}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="section">Sección</Label>
            <Select
              value={sectionId ?? ""}
              onValueChange={(v) => setSectionId(v || undefined)}
            >
              <SelectTrigger id="section">
                <SelectValue placeholder="Sin sección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {sectionsFiltered.map((s) => (
                  <SelectItem key={s.id} value={s.id!}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={itemTypeId ?? ""}
              onValueChange={(v) => setItemTypeId(v || undefined)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Sin tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {itemTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id!}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="private">Privado</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <span className="text-sm text-gray-600">
                {isPrivate
                  ? "Solo visible internamente"
                  : "Visible para todos los abogados"}
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" form="edit-client-item-form" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
