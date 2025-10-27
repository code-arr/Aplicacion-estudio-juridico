import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types/Client";

// Mapea tu texto a enum del back (ajustá si tu back usa otro casing)
const toBackType = (t: Client["type"] | undefined) =>
  t === "Fisica" ? "FISICA" : t === "Juridica" ? "JURIDICA" : undefined;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client: Client;
  onSubmit: (payload: Partial<Client>) => Promise<void>; // la llamada real se hace afuera
  loading?: boolean;
};

export default function ClientEditDialog({
  open,
  onOpenChange,
  client,
  onSubmit,
  loading,
}: Props) {
  const [form, setForm] = useState<Partial<Client>>({});

  // Inicializa con el cliente actual cuando abre
  useEffect(() => {
    if (!open) return;
    setForm({
      type: client.type,
      firstName: client.firstName ?? "",
      lastName: client.lastName ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      address: client.address ?? "",
      rut: client.rut ?? "",
      companyName: client.companyName ?? "",
      legalRepresentative: client.legalRepresentative ?? "",
    });
  }, [open, client]);

  const isJuridica = useMemo(() => form.type === "Juridica", [form.type]);

  const change = (k: keyof Client, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  // Enviar sólo lo que cambió (diff liviana)
  const makeDiff = (): Partial<Client> => {
    const out: Partial<Client> = {};
    const keys: (keyof Client)[] = [
      "type",
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "rut",
      "companyName",
      "legalRepresentative",
    ];
    keys.forEach((k) => {
      const prev = client[k] ?? "";
      const next = (form as any)[k] ?? "";
      if (String(prev) !== String(next)) (out as any)[k] = next;
    });
    // mapear type para el back
    if (out.type) (out as any).type = toBackType(out.type as any);
    return out;
  };

  const handleSave = async () => {
    const diff = makeDiff();

    // Validaciones mínimas: email si viene, rut length si viene, company si es jurídica
    if (diff.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(diff.email))) {
      alert("Email inválido");
      return;
    }
    if (
      diff.rut &&
      (String(diff.rut).length < 10 || String(diff.rut).length > 12)
    ) {
      alert("El RUT/DNI debe tener entre 10 y 12 caracteres.");
      return;
    }
    if (form.type === "Juridica" && !form.companyName) {
      alert("Para persona jurídica, el nombre de la empresa es obligatorio.");
      return;
    }

    await onSubmit(diff);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.type === "Fisica" ? "Fisica" : "Juridica"}
                onValueChange={(val) => change("type", val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fisica">Persona Física</SelectItem>
                  <SelectItem value="Juridica">Persona Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>RUT / DNI</Label>
              <Input
                value={form.rut ?? ""}
                onChange={(e) => change("rut", e.target.value)}
              />
            </div>
          </div>

          {/* Física */}
          {form.type === "Fisica" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={form.firstName ?? ""}
                  onChange={(e) => change("firstName", e.target.value)}
                />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input
                  value={form.lastName ?? ""}
                  onChange={(e) => change("lastName", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Jurídica */}
          {isJuridica && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Empresa</Label>
                <Input
                  value={form.companyName ?? ""}
                  onChange={(e) => change("companyName", e.target.value)}
                />
              </div>
              <div>
                <Label>Representante legal</Label>
                <Input
                  value={form.legalRepresentative ?? ""}
                  onChange={(e) =>
                    change("legalRepresentative", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => change("email", e.target.value)}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={form.phone ?? ""}
                onChange={(e) => change("phone", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Dirección</Label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => change("address", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
