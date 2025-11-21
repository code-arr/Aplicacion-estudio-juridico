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
import { Eye, EyeOff } from "lucide-react"; // 👈 Importamos los íconos

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
  // Datos del Abogado
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [rut, setRut] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [type, setType] = React.useState("");
  const [workedHours, setWorkedHours] = React.useState<number>(0);

  // 🔐 Datos de Seguridad (Nuevo)
  const [newPassword, setNewPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset al abrir el modal
  React.useEffect(() => {
    if (!open) return;
    setFirstName(lawyer.firstName ?? "");
    setLastName(lawyer.lastName ?? "");
    setRut(lawyer.rut ?? "");
    setPhone(lawyer.phone ?? "");
    setType(lawyer.type ?? "");
    setWorkedHours(lawyer.workedHours ?? 0);

    // Limpiamos password siempre que se abre
    setNewPassword("");
    setShowPassword(false);
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

        // 🚀 Solo mandamos password si el usuario escribió algo (evitamos mandar string vacío)
        password: newPassword.trim() || undefined,
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
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <DialogHeader>
            <DialogTitle>Editar abogado</DialogTitle>
            <DialogDescription>
              Actualizá los datos personales o de acceso.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 overflow-y-auto flex-1 pr-2 space-y-5 py-4">
          {/* === SECCIÓN 1: DATOS PERSONALES === */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">
              Información Personal
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Especialidad / Tipo</Label>
                <Input
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Ej: Penal"
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
          </div>

          {/* === SECCIÓN 2: SEGURIDAD (NUEVA) === */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-gray-900">
                Seguridad y Acceso
              </h4>
              <p className="text-xs text-gray-500">
                Si el abogado olvidó su clave, podés establecer una nueva aquí.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="new-pass">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-pass"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Dejar vacío para no cambiar"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1} // Para que no moleste al tabular
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving} className="bg-[#0f172a]">
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
