// src/components/lawyers/LawyerEditModal.tsx
import * as React from "react";
import type { Lawyer } from "@/types/Lawyer";
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
import { updateLawyer } from "@/api/lawyer";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lawyer: Lawyer;
  onSaved?: (updated: Lawyer) => void;
};

export default function LawyerEditModal({
  open,
  onOpenChange,
  lawyer,
  onSaved,
}: Props) {
  const [firstName, setFirstName] = React.useState(lawyer.firstName ?? "");
  const [lastName, setLastName] = React.useState(lawyer.lastName ?? "");
  const [rut, setRut] = React.useState(lawyer.rut ?? "");
  const [phone, setPhone] = React.useState(lawyer.phone ?? "");
  const [type, setType] = React.useState(lawyer.type ?? "");
  const [workedHours, setWorkedHours] = React.useState<number>(
    lawyer.workedHours ?? 0
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setFirstName(lawyer.firstName ?? "");
    setLastName(lawyer.lastName ?? "");
    setRut(lawyer.rut ?? "");
    setPhone(lawyer.phone ?? "");
    setType(lawyer.type ?? "");
    setWorkedHours(lawyer.workedHours ?? 0);
    setError(null);
  }, [open, lawyer]);

  const submit = async () => {
    if (!firstName || !lastName)
      return setError("Nombre y apellido son requeridos");
    if (!rut) return setError("RUT requerido");

    setSaving(true);
    setError(null);
    try {
      const dto = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        rut: rut.trim(),
        phone: phone.trim(),
        type: type.trim(),
        workedHours: Number.isFinite(Number(workedHours))
          ? Number(workedHours)
          : 0,
      };
      const updated = await updateLawyer(dto, lawyer.id);
      onSaved?.(updated);
      onOpenChange(false);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "No se pudo actualizar el abogado"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="p-0 max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-white">
          <DialogHeader>
            <DialogTitle>Editar abogado</DialogTitle>
            <DialogDescription>
              Actualizá los datos del abogado.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 overflow-y-auto flex-1 pr-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Apellido</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>RUT</Label>
              <Input value={rut} onChange={(e) => setRut(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="civil, penal, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Horas trabajadas</Label>
              <Input
                inputMode="numeric"
                value={String(workedHours)}
                onChange={(e) => setWorkedHours(Number(e.target.value || 0))}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-3 bg-white">
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
