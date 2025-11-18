// src/components/admin/LawyerCreateModal.tsx
import * as React from "react";
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
import type { RegisterPayload } from "@/api/user";
import { createLawyerWithUser } from "@/api/user";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (created: any) => void;
};

export default function LawyerCreateModal({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [rut, setRut] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset fields cada vez que se abre el modal
  React.useEffect(() => {
    if (!open) return;
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setRut("");
    setError(null);
  }, [open]);

  const submit = async () => {
    setError(null);

    // Validación mínima (igual que en edit modal: nombre requerido)
    if (!firstName || !email || !password) {
      setError("Nombre, email y contraseña son requeridos");
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterPayload = {
        user: { email: email.trim(), password: password },
        lawyer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          rut: rut.trim(),
        },
      };

      const created = await createLawyerWithUser(payload);
      onCreated?.(created);
      onOpenChange(false);
    } catch (e: any) {
      // Manejo simple — adapta si tu API devuelve otra estructura
      setError(
        e?.message ||
          e?.response?.data?.message ||
          "No se pudo crear el abogado"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="p-0 max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-white">
          <DialogHeader>
            <DialogTitle>Crear abogado</DialogTitle>
            <DialogDescription>
              Crea el usuario y el registro de abogado en una sola acción.
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
              <Label>Email (usuario)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>RUT</Label>
              <Input value={rut} onChange={(e) => setRut(e.target.value)} />
            </div>
            <div className="col-span-2" /> {/* hueco por layout */}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-3 bg-white">
          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? "Creando…" : "Crear abogado"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
