import React, { useEffect, useMemo, useState } from "react";
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
};

const initialItemState: NewItem = {
  categoryId: "",
  sectionId: "",
  itemTypeId: "",
  title: "",
  description: "",
  clientId: "",
};

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

    // si hay cliente actual, precargarlo y limpiar el resto
    if (actualClient?.id) {
      setNewItem({
        ...initialItemState,
        clientId: String(actualClient.id),
      });
    } else {
      // si no hay, reset normal vacío
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
      await createClientItem(newItem);

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
          <div className="grid gap-2">
            <Select
              value={newItem.clientId}
              onValueChange={(value: string) =>
                setNewItem((prev) => ({
                  ...prev,
                  clientId: value,
                  categoryId: "",
                  sectionId: "",
                  itemTypeId: "",
                }))
              }
              disabled={hasActualClient}
            >
              <SelectTrigger className="capitalize">
                <SelectValue
                  placeholder={
                    hasActualClient ? actualClientLabel : "Elige un cliente"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {/* Si el cliente actual no está en la lista, agregamos uno “de cortesía” para que SelectValue lo pueda mostrar */}
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
          <div className="grid gap-2">
            <Select
              value={newItem.categoryId}
              onValueChange={(value: string) =>
                setNewItem((prev) => ({
                  ...prev,
                  categoryId: value,
                  sectionId: "",
                  itemTypeId: "",
                }))
              }
            >
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
          <div className="grid gap-2">
            <Select
              value={newItem.sectionId}
              onValueChange={(value: string) =>
                setNewItem((prev) => ({
                  ...prev,
                  sectionId: value,
                  itemTypeId: "",
                }))
              }
              disabled={!newItem.categoryId || categorySections.length === 0}
            >
              <SelectTrigger
                className={`capitalize ${
                  !newItem.categoryId ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <SelectValue placeholder="Elige la seccion del item" />
              </SelectTrigger>
              <SelectContent>
                {categorySections.map((section) => (
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
          <div className="grid gap-2">
            <Select
              value={newItem.itemTypeId}
              onValueChange={(value: string) =>
                setNewItem((prev) => ({
                  ...prev,
                  itemTypeId: value,
                }))
              }
              disabled={!newItem.sectionId || sectionItemTypes.length === 0}
            >
              <SelectTrigger
                className={`capitalize ${
                  !newItem.sectionId ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <SelectValue placeholder="Elige el tipo del item" />
              </SelectTrigger>
              <SelectContent>
                {sectionItemTypes.map((itemType) => (
                  <SelectItem
                    className="capitalize"
                    key={itemType.id}
                    value={String(itemType.id)}
                  >
                    {itemType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              placeholder="Escriba una breve descripcion" //Consultar preferencias
            />
          </div>

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

export default ItemForm;
