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
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from "lucide-react";

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

/* ---------------- OptionalPricingPanel (reutilizable) ---------------- */
function OptionalPricingPanel({
  children,
  openInitially = false,
}: {
  children: React.ReactNode;
  openInitially?: boolean;
}) {
  const [open, setOpen] = useState<boolean>(openInitially);

  useEffect(() => {
    setOpen(openInitially);
  }, [openInitially]);

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 focus:outline-none"
        aria-expanded={open}
      >
        <div className="text-sm text-left">
          <div className="font-medium">
            Tarifa por hora{" "}
            <span className="text-xs text-gray-500"> (opcional)</span>
          </div>
          <div className="text-xs text-gray-500">
            Define una tarifa específica sólo para este ítem
          </div>
        </div>
        <ChevronDown
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          size={18}
        />
      </button>

      <div
        className={`px-3 py-3 bg-[hsl(225,8%,98%)] transition-[max-height,opacity] duration-200 ${
          open
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
        style={{ overflow: "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}
/* -------------------------------------------------------------------- */

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
  const [isPrivate, setIsPrivate] = useState<boolean>(item.isPrivate ?? true);
  const [hourlyRateOverride, setHourlyRateOverride] = useState<
    string | undefined
  >(item.hourlyRateOverride ?? undefined);
  const [currencyOverride, setCurrencyOverride] = useState<
    ClientItem["currencyOverride"]
  >(item.currencyOverride ?? undefined);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setStatus(item.status ?? "open");
    setIsPrivate(item.isPrivate ?? true);
    setHourlyRateOverride(item.hourlyRateOverride ?? undefined);
    setCurrencyOverride(item.currencyOverride ?? undefined);
  }, [open, item]);

  // normalize helper: convierte "" a undefined y fija 2 decimales cuando corresponde
  const normalizeHourly = (v?: string) => {
    if (!v) return undefined;
    const n = parseFloat(v);
    if (Number.isNaN(n)) return undefined;
    return n.toFixed(2);
  };

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
      const updated = await updateClientItem(item.id!, {
        title: trimmed,
        description,
        status,
        isPrivate: !!isPrivate,
        hourlyRateOverride: normalizeHourly(hourlyRateOverride),
        currencyOverride: currencyOverride ?? undefined,
      });

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

          {/* Privado / Compartido */}
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

          {/* Optional pricing panel */}
          <OptionalPricingPanel
            openInitially={!!(hourlyRateOverride || currencyOverride)}
          >
            <div className="grid gap-2">
              <Label htmlFor="hr-edit">Tarifa por hora</Label>
              <Input
                id="hr-edit"
                type="number"
                step="0.01"
                value={hourlyRateOverride ?? ""}
                placeholder="Ej: 55000"
                onChange={(e) => setHourlyRateOverride(e.target.value)}
              />
            </div>

            <div className="grid gap-2 mt-2">
              <Label>Moneda</Label>
              <Select
                value={currencyOverride ?? ""}
                onValueChange={(v) =>
                  setCurrencyOverride((v as any) || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Moneda (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="UF">UF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </OptionalPricingPanel>
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
