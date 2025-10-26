// src/components/documents/RenameDocumentModal.tsx
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName: string;
  onConfirm: (newName: string) => void; // la page hace la API
  loading?: boolean;
};

export default function RenameDocumentModal({
  open,
  onOpenChange,
  initialName,
  onConfirm,
  loading,
}: Props) {
  const [value, setValue] = React.useState(initialName);

  React.useEffect(() => {
    if (open) setValue(initialName);
  }, [open, initialName]);

  const disabled =
    loading ||
    value.trim().length < 2 ||
    value.trim() === (initialName ?? "").trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogTitle>Renombrar documento</DialogTitle>
        <DialogDescription>
          Cambiá solo el nombre del archivo.
        </DialogDescription>

        <div className="mt-4 space-y-2">
          <label className="text-sm text-gray-600">Nuevo nombre</label>
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ej: Contrato arrendamiento v2"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={() => onConfirm(value.trim())} disabled={disabled}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
