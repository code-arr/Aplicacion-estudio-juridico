// src/components/clients/ClientEditModal.tsx
import * as React from "react";
import type {
  Client,
  ClientType,
  ClientStatus,
  Currency,
} from "@/types/Client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateClient } from "@/api/client";
import { CLIENT_STATUS_MAP } from "@/types/Client";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client: Client; // cliente completo a editar
  onSaved?: (updated: Client) => void; // callback con el cliente actualizado
};

const CURRENCIES: Currency[] = ["CLP", "USD", "UF"];
const STATUSES: ClientStatus[] = ["active", "inactive", "under_review"];

function formatRutLive(value: string) {
  const raw = value.replace(/[^\dkK]/g, "").toUpperCase();
  const match = raw.match(/^(\d{0,8})([\dK]?)$/);
  if (!match) return "";
  const body = match[1];
  const dv = match[2];
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dv ? `${withDots}-${dv}` : withDots;
}

function validateRut(chileanRut: string) {
  const clean = chileanRut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0,
    mult = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const mod = 11 - (sum % 11);
  const dvExpected = mod === 11 ? "0" : mod === 10 ? "K" : String(mod);
  return dv === dvExpected;
}
const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
const validateRate = (s?: string) =>
  s && Number.isFinite(Number(s)) && Number(s) > 0
    ? null
    : "La tarifa debe ser un número > 0";

export default function ClientEditModal({
  open,
  onOpenChange,
  client,
  onSaved,
}: Props) {
  const [type, setType] = React.useState<ClientType>(client.type);
  const [status, setStatus] = React.useState<ClientStatus>(
    client.status ?? "active"
  );
  const [currency, setCurrency] = React.useState<Currency>(client.currency);
  const [hourlyRate, setHourlyRate] = React.useState<string>(
    client.hourlyRate ?? ""
  );

  // Comunes
  const [rut, setRut] = React.useState(client.rut ?? "");
  const [email, setEmail] = React.useState(client.email ?? "");
  const [phone, setPhone] = React.useState(client.phone ?? "");
  const [address, setAddress] = React.useState(client.address ?? "");
  /* const [profileImage, setProfileImage] = React.useState(
    client.profileImage ?? ""
  ); */

  // Fisica
  const [firstName, setFirstName] = React.useState(client.firstName ?? "");
  const [lastName, setLastName] = React.useState(client.lastName ?? "");

  // Juridica
  const [companyName, setCompanyName] = React.useState(
    client.companyName ?? ""
  );
  const [legalRepresentative, setLegalRepresentative] = React.useState(
    client.legalRepresentative ?? ""
  );

  // UI
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    // Reset al abrir (por si abrís distintos clientes)
    setType(client.type);
    setStatus(client.status ?? "active");
    setCurrency(client.currency);
    setHourlyRate(client.hourlyRate ?? "");

    setRut(client.rut ?? "");
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setAddress(client.address ?? "");
    /* setProfileImage(client.profileImage ?? ""); */

    setFirstName(client.firstName ?? "");
    setLastName(client.lastName ?? "");
    setCompanyName(client.companyName ?? "");
    setLegalRepresentative(client.legalRepresentative ?? "");
    setError(null);
  }, [open, client]);

  const submit = async () => {
    // Validaciones
    if (!rut || !validateRut(rut)) return setError("RUT inválido");
    if (!isValidEmail(email)) return setError("Email inválido");
    const rateErr = validateRate(hourlyRate);
    if (rateErr) return setError(rateErr);
    if (!["CLP", "USD", "UF"].includes(currency))
      return setError("Moneda inválida");

    if (type === "Fisica") {
      if (!firstName || !lastName)
        return setError("Nombre y apellido son requeridos");
    } else {
      if (!companyName) return setError("Nombre de la compañía es requerido");
      if (!legalRepresentative)
        return setError("Representante legal es requerido");
    }

    setSaving(true);
    setError(null);
    try {
      const dto: Partial<Client> = {
        type,
        status,
        rut,
        email,
        phone,
        address,
        /* profileImage: profileImage || undefined, */
        currency,
        hourlyRate: hourlyRate?.trim() || undefined,
        firstName: type === "Fisica" ? firstName : undefined,
        lastName: type === "Fisica" ? lastName : undefined,
        companyName: type === "Juridica" ? companyName : undefined,
        legalRepresentative:
          type === "Juridica" ? legalRepresentative : undefined,
      };

      const updated = await updateClient(client.id!, dto); // ← asume { id, ...fields } de vuelta
      onSaved?.(updated);
      onOpenChange(false);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "No se pudo actualizar el cliente"
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
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>
              Actualizá los datos del cliente.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 overflow-y-auto flex-1 pr-2 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ClientType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Juridica">Juridica</SelectItem>
                  <SelectItem value="Fisica">Fisica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ClientStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CLIENT_STATUS_MAP[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>RUT</Label>
              <Input
                value={rut}
                onChange={(e) => setRut(formatRutLive(e.target.value))}
              />
            </div>
          </div>

          {/* Persona / Empresa */}
          {type === "Fisica" ? (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Compañía</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Representante legal</Label>
                <Input
                  value={legalRepresentative}
                  onChange={(e) => setLegalRepresentative(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input
                value={phone ?? ""}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Dirección</Label>
              <Input
                value={address ?? ""}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Facturación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Moneda</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tarifa por hora</Label>
              <Input
                inputMode="decimal"
                value={hourlyRate}
                onChange={(e) =>
                  setHourlyRate(e.target.value.replace(",", "."))
                }
                placeholder={currency === "CLP" ? "55000" : "75.5"}
              />
            </div>
            {/* <div className="grid gap-2">
              <Label>Foto/Avatar (URL)</Label>
              <Input
                value={profileImage ?? ""}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://…"
              />
            </div> */}
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
