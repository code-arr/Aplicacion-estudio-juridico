// src/components/items/EditClientItemDialog.tsx
import { useEffect, useState } from "react";
import type { ClientItem } from "@/types/ClientItem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateClientItem } from "@/api/clientItem";
import { useClientItemStore } from "@/store/useClientItemStore";
import { useToast } from "@/hooks/useToast";
import { Switch } from "@/components/ui/switch"; // ⬅️ tu Switch

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: ClientItem;
};

const STATUS_OPTIONS = [
  { value: "open", label: "Abierto" },
  { value: "on_hold", label: "En pausa" },
  { value: "closed", label: "Cerrado" },
] as const;

export default function EditClientItemDialog({
  open,
  onOpenChange,
  item,
}: Props) {
  const { toast } = useToast?.() ?? { toast: () => {} };

  const [title, setTitle] = useState(item.title ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [status, setStatus] = useState<ClientItem["status"]>(
    item.status ?? "open"
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(item.private ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setStatus(item.status ?? "open");
    setIsPrivate(item.private ?? true);
  }, [open, item]);

  const onSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast({
        title: "Falta el título",
        description: "Ingresá un título válido.",
      });
      return;
    }
    setSaving(true);
    try {
      // 1) Request directo a la API (incluye `private`)
      const updated = await updateClientItem(item.id!, {
        title: trimmed,
        description,
        status,
        private: !!isPrivate,
      });

      // 2) Merge local (detalles + listas del store)
      const S = useClientItemStore.getState();
      const curAll = S.clientItems ?? null;
      const curByClient = S.clientItemsByClientId ?? null;

      const patchOne = (arr: ClientItem[] | null) =>
        arr
          ? arr.map((it) => (it.id === item.id ? { ...it, ...updated } : it))
          : arr;

      useClientItemStore.setState({
        clientItems: patchOne(curAll),
        clientItemsByClientId: patchOne(curByClient),
        clientItemDetail:
          S.clientItemDetail?.id === item.id
            ? { ...S.clientItemDetail, ...updated }
            : S.clientItemDetail,
      });

      toast({
        title: "Cambios guardados",
        description: "El ítem fue actualizado.",
      });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "No se pudo actualizar",
        description: e?.response?.data?.message ?? "Error inesperado",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar ítem</DialogTitle>
          <DialogDescription>
            Cambiá el título, estado, descripción o privacidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Demanda por cobro de pesos"
            />
          </div>

          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un estado" />
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
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Notas o detalle del ítem…"
            />
          </div>

          {/* ⬇️ NUEVO: Privado / Compartido */}
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-3">
            <div className="flex flex-col">
              <Label className="mb-0.5">Privado (solo yo)</Label>
              <span className="text-sm text-[hsl(225,10%,45%)]">
                Si lo desactivás, el ítem se comparte con el resto de abogados.
              </span>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(!!checked)}
              aria-label="Marcar ítem como privado"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
