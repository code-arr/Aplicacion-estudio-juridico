// src/components/items/ItemForm.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ItemType, Section } from "@/types/Catalog";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useClientStore } from "@/store/useClientStore";
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
import { createClientItem } from "@/api/clientItem";
import { useClientItemStore } from "@/store/useClientItemStore";
import { useLawyerStore } from "@/store/useLawyerStore";
import type { Client } from "@/types/Client";
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from "lucide-react";

type ItemFormProps = {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type NewItem = {
  categoryId: string;
  sectionId: string;
  itemTypeId: string;
  title: string;
  description: string;
  clientId: string;
  private: boolean;
  hourlyRateOverride?: string; // string con formato "1234.50"
  currencyOverride?: "CLP" | "USD" | "UF";
};

const initialItemState: NewItem = {
  categoryId: "",
  sectionId: "",
  itemTypeId: "",
  title: "",
  description: "",
  clientId: "",
  private: true,
  hourlyRateOverride: undefined,
  currencyOverride: undefined,
};

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

const ClientSelectRow = React.memo(function ClientSelectRow({
  value,
  hasActualClient,
  clients,
  actualClient,
  actualClientLabel,
  onChange,
}: {
  value: string;
  hasActualClient: boolean;
  clients: Client[] | null;
  actualClient: Client | null;
  actualClientLabel: string | undefined;
  onChange: (val: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Select value={value} onValueChange={onChange} disabled={hasActualClient}>
        <SelectTrigger className="capitalize">
          <SelectValue
            placeholder={
              hasActualClient ? actualClientLabel : "Elige un cliente"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {hasActualClient &&
            !clients?.some((c) => c.id === actualClient?.id) && (
              <SelectItem
                value={String(actualClient!.id)}
                className="capitalize"
              >
                {actualClientLabel}
              </SelectItem>
            )}
          {clients?.map((client) => (
            <SelectItem
              className="capitalize"
              key={client.id}
              value={String(client.id)}
            >
              {client.type === "Fisica"
                ? `${client.firstName} ${client.lastName}`
                : client.companyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

const CategorySelectRow = React.memo(function CategorySelectRow({
  value,
  categories,
  onChange,
}: {
  value: string;
  categories: any[];
  onChange: (val: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="capitalize">
          <SelectValue placeholder="Elige la categoria del item" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem
              className="capitalize"
              key={category.id}
              value={String(category.id)}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

const SectionSelectRow = React.memo(function SectionSelectRow({
  value,
  disabled,
  sections,
  onChange,
}: {
  value: string;
  disabled: boolean;
  sections: any[];
  onChange: (val: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={`capitalize ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <SelectValue placeholder="Elige la seccion del item" />
        </SelectTrigger>
        <SelectContent>
          {sections.map((section) => (
            <SelectItem
              className="capitalize"
              key={section.id}
              value={String(section.id)}
            >
              {section.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

const ItemTypeSelectRow = React.memo(function ItemTypeSelectRow({
  value,
  disabled,
  itemTypes,
  onChange,
}: {
  value: string;
  disabled: boolean;
  itemTypes: any[];
  onChange: (val: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={`capitalize ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <SelectValue placeholder="Elige el tipo del item" />
        </SelectTrigger>
        <SelectContent>
          {itemTypes.map((it) => (
            <SelectItem
              className="capitalize"
              key={it.id}
              value={String(it.id)}
            >
              {it.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

const ItemForm = ({ isDialogOpen, setIsDialogOpen }: ItemFormProps) => {
  const { categories, sections, itemTypes } = useCatalogStore();
  const [newItem, setNewItem] = useState<NewItem>(initialItemState);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lawyerId = useLawyerStore((s) => s.lawyer?.id);

  const fetchClientItemsByLawyerId = useClientItemStore(
    (s) => s.fetchClientItemsByLawyerId
  );
  const fetchClientItemsByClientId = useClientItemStore(
    (s) => s.fetchClientItemsByClientId
  );

  const clients = useClientStore((s) => s.clientsByLawyer);
  const actualClient = useClientStore((s) => s.clientDetail);

  const hasActualClient = !!actualClient?.id;

  const actualClientLabel = useMemo(() => {
    if (!actualClient) return "";
    return actualClient.type === "Fisica"
      ? `${actualClient.firstName} ${actualClient.lastName}`
      : actualClient.companyName;
  }, [actualClient]);

  useEffect(() => {
    if (!isDialogOpen) return;

    if (actualClient?.id) {
      setNewItem({
        ...initialItemState,
        clientId: String(actualClient.id),
      });
    } else {
      setNewItem(initialItemState);
    }
  }, [isDialogOpen, actualClient?.id]);

  const categorySections: Section[] = useMemo(
    () => sections.filter((s) => String(s.categoryId) === newItem.categoryId),
    [sections, newItem.categoryId]
  );

  const sectionItemTypes: ItemType[] = useMemo(
    () => itemTypes.filter((t) => String(t.sectionId) === newItem.sectionId),
    [itemTypes, newItem.sectionId]
  );

  function validate(): string | null {
    if (!newItem.categoryId) return "La categoria es obligatoria.";
    if (!newItem.sectionId) return "La seccion es obligatoria.";
    if (!newItem.itemTypeId) return "El tipo de item es obligatorio.";
    if (!newItem.title.trim()) return "El titulo es obligatorio.";
    if (!newItem.description.trim()) return "La descripcion es obligatoria.";
    if (!newItem.clientId) return "El cliente es obligatorio.";
    return null;
  }

  // normalize helper: convierte "" a undefined y fija 2 decimales cuando corresponde
  const normalizeHourly = (v?: string) => {
    if (!v) return undefined;
    const n = parseFloat(v);
    if (Number.isNaN(n)) return undefined;
    return n.toFixed(2);
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      await createClientItem({
        ...newItem,
        isPrivate: !!newItem.private,
        hourlyRateOverride: normalizeHourly(newItem.hourlyRateOverride),
        currencyOverride: newItem.currencyOverride ?? undefined,
      });

      if (hasActualClient) {
        await fetchClientItemsByClientId(actualClient.id!);
        await fetchClientItemsByLawyerId(lawyerId!);
      } else {
        await fetchClientItemsByLawyerId(lawyerId!);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? "No se pudo crear el item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setNewItem(initialItemState);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Item</DialogTitle>
          <DialogDescription>
            Complete los detalles del item para comenzar a trabajar en ello.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 pt-4 pb-2" onSubmit={handleAddItem}>
          <ClientSelectRow
            value={newItem.clientId}
            hasActualClient={hasActualClient}
            clients={clients}
            actualClient={actualClient}
            actualClientLabel={actualClientLabel}
            onChange={useCallback((value: string) => {
              setNewItem((prev) => ({
                ...prev,
                clientId: value,
                categoryId: "",
                sectionId: "",
                itemTypeId: "",
              }));
            }, [])}
          />

          <CategorySelectRow
            value={newItem.categoryId}
            categories={categories}
            onChange={useCallback((value: string) => {
              setNewItem((prev) => ({
                ...prev,
                categoryId: value,
                sectionId: "",
                itemTypeId: "",
              }));
            }, [])}
          />

          <SectionSelectRow
            value={newItem.sectionId}
            disabled={!newItem.categoryId || categorySections.length === 0}
            sections={categorySections}
            onChange={useCallback((value: string) => {
              setNewItem((prev) => ({
                ...prev,
                sectionId: value,
                itemTypeId: "",
              }));
            }, [])}
          />

          <ItemTypeSelectRow
            value={newItem.itemTypeId}
            disabled={!newItem.sectionId || sectionItemTypes.length === 0}
            itemTypes={sectionItemTypes}
            onChange={useCallback((value: string) => {
              setNewItem((prev) => ({ ...prev, itemTypeId: value }));
            }, [])}
          />

          <div className="grid gap-2">
            <Label htmlFor="title">Titulo del Item</Label>
            <Input
              required
              id="title"
              value={newItem.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewItem({
                  ...newItem,
                  title: e.target.value,
                })
              }
              placeholder="Juicio Tribunal Civil 187"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción del Item</Label>
            <Input
              required
              id="description"
              value={newItem.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewItem({
                  ...newItem,
                  description: e.target.value,
                })
              }
              placeholder="Escriba una breve descripcion"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          {/* Privacidad */}
          <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-3">
            <div className="flex flex-col">
              <Label className="mb-0.5">Privado (solo yo)</Label>
              <span className="text-sm text-[hsl(225,10%,45%)]">
                Si lo desactivás, el ítem se comparte con el resto de abogados.
              </span>
            </div>
            <Switch
              checked={newItem.private}
              onCheckedChange={(checked) =>
                setNewItem((prev) => ({ ...prev, private: !!checked }))
              }
              aria-label="Marcar ítem como privado"
            />
          </div>

          {/* Optional pricing panel */}
          <OptionalPricingPanel
            openInitially={
              !!(newItem.hourlyRateOverride || newItem.currencyOverride)
            }
          >
            <div className="grid gap-2">
              <Label htmlFor="hourlyRate">Tarifa por hora</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={newItem.hourlyRateOverride ?? ""}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    hourlyRateOverride: e.target.value,
                  }))
                }
                placeholder="p. ej. 120000.00"
              />
            </div>

            <div className="grid gap-2 mt-2">
              <Label>Moneda</Label>
              <Select
                value={newItem.currencyOverride ?? ""}
                onValueChange={(v) =>
                  setNewItem((prev) => ({
                    ...prev,
                    currencyOverride: (v as any) || undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="UF">UF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </OptionalPricingPanel>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <DialogFooter className="pt-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Agregar Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(ItemForm);
