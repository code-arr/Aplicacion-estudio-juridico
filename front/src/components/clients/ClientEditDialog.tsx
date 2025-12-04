// front/src/components/clients/ClientEditDialog.tsx
import { useEffect, useState } from "react";
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

// ⚠️ Eliminé toBackType porque tu base de datos usa "Fisica" y "Juridica" directo.

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client: Client;
  onSubmit: (payload: Partial<Client>) => Promise<void>;
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

  // Inicializa con el cliente actual
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
      // 🆕 Agregamos los campos de dinero
      currency: client.currency ?? "CLP",
      hourlyRate: client.hourlyRate ?? "", // Si viene null del back, mostramos ""
    });
  }, [open, client]);

  const change = (k: keyof Client, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  // Enviar sólo lo que cambió
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
      "currency", // 🆕
      "hourlyRate", // 🆕
    ];

    keys.forEach((k) => {
      let prev = client[k];
      let next = (form as any)[k];

      // Normalización para comparación (null vs "")
      if (prev === null || prev === undefined) prev = "";
      if (next === null || next === undefined) next = "";

      // Si hay cambio, lo agregamos
      if (String(prev) !== String(next)) {
        // Lógica especial para hourlyRate: Si quedó vacío, mandar null
        if (k === "hourlyRate" && next === "") {
          (out as any)[k] = null;
        } else {
          (out as any)[k] = (form as any)[k];
        }
      }
    });

    return out;
  };

  const handleSave = async () => {
    const diff = makeDiff();

    // Validaciones básicas
    if (diff.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(diff.email))) {
      // Usá toast en vez de alert si podés, pero por ahora alert cumple
      alert("Email inválido");
      return;
    }
    // Si cambió a Jurídica (o ya lo era y cambió el nombre) validamos
    const currentType = diff.type ?? client.type;
    const currentName = diff.companyName ?? client.companyName;

    if (currentType === "Juridica" && !currentName) {
      alert("Para persona jurídica, el nombre de la empresa es obligatorio.");
      return;
    }

    await onSubmit(diff);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Fila 1: Tipo y RUT */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
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
            <div className="grid gap-2">
              <Label>RUT / DNI</Label>
              <Input
                value={form.rut ?? ""}
                onChange={(e) => change("rut", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 2: Nombre/Empresa */}
          {form.type === "Fisica" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nombre</Label>
                <Input
                  value={form.firstName ?? ""}
                  onChange={(e) => change("firstName", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Apellido</Label>
                <Input
                  value={form.lastName ?? ""}
                  onChange={(e) => change("lastName", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Empresa</Label>
                <Input
                  value={form.companyName ?? ""}
                  onChange={(e) => change("companyName", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Representante Legal</Label>
                <Input
                  value={form.legalRepresentative ?? ""}
                  onChange={(e) =>
                    change("legalRepresentative", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Fila 3: Contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => change("email", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input
                value={form.phone ?? ""}
                onChange={(e) => change("phone", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 4: Dirección */}
          <div className="grid gap-2">
            <Label>Dirección</Label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => change("address", e.target.value)}
            />
          </div>

          {/* 🆕 Fila 5: Facturación (Lo que faltaba) */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="grid gap-2">
              <Label>Moneda</Label>
              <Select
                value={form.currency}
                onValueChange={(val) => change("currency", val as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP (Peso)</SelectItem>
                  <SelectItem value="USD">USD (Dólar)</SelectItem>
                  <SelectItem value="UF">UF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tarifa por Hora</Label>
              <Input
                type="number" // O text con inputMode="decimal"
                value={form.hourlyRate ?? ""}
                placeholder={form.currency === "CLP" ? "Ej: 50000" : "Ej: 80.5"}
                onChange={(e) => change("hourlyRate", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
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
