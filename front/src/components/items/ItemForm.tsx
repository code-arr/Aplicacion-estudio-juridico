import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { useCatalogStore } from "@/store/useCatalogStore";
import type { ItemType, Section } from "@/types/Catalog";
import React, { useState } from "react";

type ItemFormProps = {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type NewItem = {
  category: string;
  section: string;
  itemType: string;
  title: string;
  description: string;
};

const initialItemState: NewItem = {
  category: "",
  section: "",
  itemType: "",
  title: "",
  description: "",
};

const ItemForm = ({ isDialogOpen, setIsDialogOpen }: ItemFormProps) => {
  const { categories, sections, itemTypes } = useCatalogStore();
  const [newItem, setNewItem] = useState<NewItem>(initialItemState);

  const categorySections = (): Section[] => {
    const filteredSections = sections.filter(
      (section) => String(section.categoryId) === newItem.category
    );
    return filteredSections;
  };

  const sectionItemTypes = (): ItemType[] => {
    const filteredItemTypes = itemTypes.filter(
      (itemType) => String(itemType.sectionId) === newItem.section
    );
    return filteredItemTypes;
  };

  const handleAddItem = () => {};

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
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Select
              value={newItem.category}
              onValueChange={(value) =>
                setNewItem((prev) => ({
                  ...prev,
                  category: value,
                  section: "",
                  itemType: "",
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
              value={newItem.section}
              onValueChange={(value) =>
                setNewItem((prev) => ({
                  ...prev,
                  section: value,
                  itemType: "",
                }))
              }
              disabled={!newItem.category}
            >
              <SelectTrigger
                className={`capitalize ${
                  !newItem.category ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <SelectValue placeholder="Elige la seccion del item" />
              </SelectTrigger>
              <SelectContent>
                {categorySections().map((section) => (
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
              value={newItem.itemType}
              onValueChange={(value) =>
                setNewItem((prev) => ({
                  ...prev,
                  itemType: value,
                }))
              }
              disabled={!newItem.section}
            >
              <SelectTrigger
                className={`capitalize ${
                  !newItem.section ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <SelectValue placeholder="Elige el tipo del item" />
              </SelectTrigger>
              <SelectContent>
                {sectionItemTypes().map((itemType) => (
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
              onChange={(e) =>
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
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  description: e.target.value,
                })
              }
              placeholder="Escriba una breve descripcion" //Consultar preferencias
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddItem}>
            Agregar Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemForm;
