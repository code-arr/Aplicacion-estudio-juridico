/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SegmentedToggle,
  SegmentedToggleItem,
} from "@/components/ui/segmentedtoggle";
import { createClient, linkClientToLawyer } from "@/api/client";
import type { Client, ClientType } from "@/types/Client";
import { useClientStore } from "@/store/useClientStore";
import { useLawyerStore } from "@/store/useLawyerStore";

// Hook chico para "debounce" sin dependencias externas (simple y suficiente)
function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

type ClientFormProps = {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

// Mostrar cada resultado de búsqueda
type ClientSearchItem = {
  id?: string;
  type: ClientType;
  display: string; // nombre completo o razón social
  rut: string;
};

const ClientForm = ({ isDialogOpen, setIsDialogOpen }: ClientFormProps) => {
  // 🔁 Nuevo: modo de trabajo
  const [mode, setMode] = useState<"crear" | "vincular">("crear");

  const [clientType, setClientType] = useState<ClientType>("Juridica");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // 🔍 Estado para "Vincular existente"
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedQuery = useDebouncedValue(searchTerm, 250);
  const [results, setResults] = useState<ClientSearchItem[]>([]);

  const lawyerId = useLawyerStore((s) => s.lawyer?.id);

  const clients = useClientStore((state) => state.clientsAll);
  const actualLawyerClients = useClientStore((state) => state.clientsByLawyer);
  const hydrateByLawyer = useClientStore((state) => state.hydrateByLawyer);

  // Cliente duplicado (si el RUT ya existe en la app)
  const [dupCandidate, setDupCandidate] = useState<Client | null>(null);

  function findClientByRut(all: Client[] = [], rut?: string) {
    if (!rut) return null;
    const key = normRut(rut);
    return all.find((c) => normRut(c.rut || "") === key) || null;
  }

  // 🏢 Empresa
  const [newCompanyClient, setNewCompanyClient] = useState({
    companyName: "",
    legalRepresentative: "",
    rut: "",
    phone: "",
    email: "",
    address: "",
    type: "Juridica",
  });

  // 🧑 Persona
  const [newPersonClient, setNewPersonClient] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    phone: "",
    email: "",
    address: "",
    type: "Fisica",
  });

  // ✅ Formateo y validaciones
  function formatRutLive(value: string) {
    // Acepta dígitos y K/k, transforma a mayúsculas
    const raw = value.replace(/[^\dkK]/g, "").toUpperCase();

    // Captura hasta 8 dígitos de cuerpo y, si existe, 1 DV (dígito o K)
    const match = raw.match(/^(\d{0,8})([\dK]?)$/);
    if (!match) return "";

    const body = match[1];
    const dv = match[2];

    // Agrupa desde la derecha: 12.345.678
    const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Muestra guion solo si hay DV
    return dv ? `${withDots}-${dv}` : withDots;
  }

  /* function formatRutLive(value: string) {
    // Eliminar todo lo que no sea dígito o K/k
    const clean = value
      .replace(/[^\dkK]/gi, "")
      .toUpperCase()
      .slice(0, 9);

    let result = "";

    for (let i = 0; i < clean.length; i++) {
      if (i === 2 || i === 5) {
        result += ".";
      }
      if (i === 8) {
        result += "-";
      }
      result += clean[i];
    }

    return result;
  } */

  function validateRut(chileanRut: string) {
    const clean = chileanRut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
    if (clean.length < 2) return false;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    let sum = 0,
      multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const mod = 11 - (sum % 11);
    const dvExpected = mod === 11 ? "0" : mod === 10 ? "K" : String(mod);
    return dv === dvExpected;
  }

  function isValidEmail(v: string) {
    return /\S+@\S+\.\S+/.test(v);
  }

  /*   function buildDto() {
    if (clientType === "Fisica") {
      return {
        type: "Fisica",
        firstName: newPersonClient.firstName.trim(),
        lastName: newPersonClient.lastName.trim(),
        rut: newPersonClient.rut.trim(),
        phone: newPersonClient.phone.trim(),
        email: newPersonClient.email.trim(),
        address: newPersonClient.address.trim(),
      };
    }
    return {
      type: "Juridica",
      companyName: newCompanyClient.companyName.trim(),
      legalRepresentative: newCompanyClient.legalRepresentative.trim(),
      rut: newCompanyClient.rut.trim(),
      phone: newCompanyClient.phone.trim(),
      email: newCompanyClient.email.trim(),
      address: newCompanyClient.address.trim(),
    };
  } */

  function validate(): string | null {
    if (clientType === "Fisica") {
      const c = newPersonClient;
      if (!c.firstName || !c.lastName)
        return "Nombre y apellido son requeridos";
      if (!c.rut || !validateRut(c.rut)) return "RUT inválido";
      if (!isValidEmail(c.email)) return "Email inválido";
      if (!c.phone) return "Teléfono requerido";
      if (!c.address) return "Domicilio requerido";
      return null;
    }
    const c = newCompanyClient;
    if (!c.companyName) return "Nombre de la compañía es requerido";
    if (!c.legalRepresentative) return "Representante legal es requerido";
    if (!c.rut || !validateRut(c.rut)) return "RUT inválido";
    if (!isValidEmail(c.email)) return "Email inválido";
    if (!c.phone) return "Teléfono requerido";
    if (!c.address) return "Dirección requerida";
    return null;
  }

  function reset() {
    setNewCompanyClient({
      companyName: "",
      legalRepresentative: "",
      rut: "",
      phone: "",
      email: "",
      address: "",
      type: "Juridica",
    });
    setNewPersonClient({
      firstName: "",
      lastName: "",
      rut: "",
      phone: "",
      email: "",
      address: "",
      type: "Fisica",
    });
    setErrorMsg(null);
  }

  // ---- Submit ----
  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      if (dupCandidate) {
        setErrorMsg("Ese RUT ya existe. Vinculalo o cambiá el RUT.");
        return;
      }
      await createClient(
        (clientType === "Juridica"
          ? newCompanyClient
          : newPersonClient) as Client
      );
      reset();

      await hydrateByLawyer(lawyerId!, { force: true });

      setIsDialogOpen(false);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ?? "No se pudo crear el cliente"
      );
    } finally {
      setLoading(false);
    }
  };

  // Vincular existente (desde resultados de búsqueda o banner de RUT)
  const handleLink = async (clientId: string | undefined) => {
    if (!clientId) {
      setErrorMsg("No se indicó el ID del cliente a vincular");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await linkClientToLawyer(clientId);
      reset();

      await hydrateByLawyer(lawyerId!, { force: true });

      setIsDialogOpen(false);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ?? "No se pudo vincular el cliente"
      );
    } finally {
      setLoading(false);
    }
  };

  function handleRutBlurLocal(rut: string) {
    const found = findClientByRut((clients as Client[]) ?? [], rut);
    setDupCandidate(found || null);
    setInfoMsg(
      found
        ? `El RUT ya existe (${
            found.type === "Juridica"
              ? found.companyName
              : `${found.firstName} ${found.lastName}`
          }). Podés vincularlo.`
        : null
    );
  }

  // 👉 Helpers mínimos
  const fold = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const norm = (s: string) => fold(s).toLowerCase();
  const normRut = (s: string) => s.replace(/[.\-]/g, "").toUpperCase();
  const getClientDisplay = (c: any) =>
    c.type === "Juridica" ? c.companyName : `${c.firstName} ${c.lastName}`;

  // IDs de clientes ya vinculados al abogado actual
  const linkedIds = useMemo(() => {
    return new Set((actualLawyerClients ?? []).map((c: any) => c.id));
  }, [actualLawyerClients]);

  // 🧠 Índice memoizado a partir de `clients`
  // Se recalcula SOLO cuando cambia la lista global de clientes
  const searchIndex = useMemo(() => {
    const list = (clients ?? []) as Client[];
    return list.map((c) => ({
      id: c.id as string,
      ref: c,
      text: norm(
        `${getClientDisplay(c)} ${c.legalRepresentative ?? ""} ${c.email ?? ""}`
      ),
      rutKey: normRut(c.rut ?? ""),
    }));
  }, [clients]);

  // 🧠 Versión del índice filtrada para EXCLUIR los ya vinculados
  // Se recalcula solo si cambian `clients` o `actualLawyerClients`
  const availableIndex = useMemo(() => {
    if (!linkedIds || linkedIds.size === 0) return searchIndex;
    return searchIndex.filter((row) => !linkedIds.has(row.id));
  }, [searchIndex, linkedIds]);

  // 🔎 Búsqueda local en modo "vincular" utilizando el índice memoizado
  useEffect(() => {
    let active = true;

    function run() {
      if (mode !== "vincular") return;

      const q = debouncedQuery.trim();
      if (!q) {
        setResults([]);
        return;
      }

      const nq = norm(q);
      const nqRut = normRut(q);

      // Filtramos contra el índice ya normalizado
      const hits = availableIndex.filter(
        (row) => row.text.includes(nq) || (nqRut && row.rutKey.includes(nqRut))
      );

      const items = hits.slice(0, 4).map((row) => ({
        id: row.id,
        type: row.ref.type,
        display: getClientDisplay(row.ref),
        rut: row.ref.rut,
      }));

      if (!active) return;
      setResults(items);
    }

    run();
    return () => {
      active = false;
    };
  }, [debouncedQuery, mode, availableIndex]);

  useEffect(() => {
    if (mode === "crear") setSearchTerm("");
  }, [mode]);

  useEffect(() => {
    if (mode === "vincular") {
      setDupCandidate(null);
      setInfoMsg(null);
    }
  }, [mode]);

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          reset();
          setMode("crear");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Complete la información del cliente para comenzar a gestionar su
            caso.
          </DialogDescription>
        </DialogHeader>

        {/* 🔁 Toggle de modo */}
        <SegmentedToggle
          className="max-w-md"
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as "crear" | "vincular")}
        >
          <SegmentedToggleItem value="crear">Crear nuevo</SegmentedToggleItem>
          <SegmentedToggleItem value="vincular">
            Vincular existente
          </SegmentedToggleItem>
        </SegmentedToggle>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* MODO: VINCULAR EXISTENTE */}
        {mode === "vincular" && (
          <div className="grid gap-3 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="search">
                Buscar cliente (nombre, empresa o RUT)
              </Label>
              <div className="min-h-64">
                <div className="relative">
                  <Input
                    id="search"
                    className="w-full mb-0" /* asegurate que no tenga margin-bottom */
                    placeholder="Ej: 'Pérez' o '77.233.445-7'"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {/* Dropdown de resultados: misma anchura que el input */}
                  {searchTerm && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-3 rounded-md border bg-popover shadow-sm">
                      {results.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">
                          Sin resultados
                        </div>
                      ) : (
                        <ul className="max-h-64 overflow-auto">
                          {results.map((r) => (
                            <li
                              key={r.id}
                              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-accent"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                  {r.display}{" "}
                                  {r.type === "Juridica"
                                    ? "· Empresa"
                                    : "· Persona"}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                  RUT: {r.rut}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleLink(r.id)}
                              >
                                Vincular
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {/* Opción de crear si no lo encuentra */}
                      <div className="border-t p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          onClick={() => setMode("crear")}
                        >
                          ¿No lo encontraste? Crear nuevo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* MODO: CREAR NUEVO (tu formulario + chequeo RUT) */}
        {mode === "crear" && (
          <form onSubmit={handleAddClient} className="grid gap-4 pt-4 pb-2">
            <SegmentedToggle
              className="max-w-md"
              type="single"
              value={clientType}
              onValueChange={(value) =>
                value && (setClientType(value as ClientType), setInfoMsg(null))
              }
              onClick={reset}
            >
              <SegmentedToggleItem
                value="Juridica"
                onChange={() => setClientType("Juridica")}
              >
                Persona Juridica
              </SegmentedToggleItem>
              <SegmentedToggleItem
                value="Fisica"
                onChange={() => setClientType("Fisica")}
              >
                Persona Fisica
              </SegmentedToggleItem>
            </SegmentedToggle>

            {clientType === "Fisica" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Nombre/s de la Persona</Label>
                  <Input
                    required
                    id="firstName"
                    value={newPersonClient.firstName}
                    onChange={(e) =>
                      setNewPersonClient({
                        ...newPersonClient,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="Juan Fransisco"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Apellido/s de la Pesona</Label>
                  <Input
                    required
                    id="lastName"
                    value={newPersonClient.lastName}
                    onChange={(e) =>
                      setNewPersonClient({
                        ...newPersonClient,
                        lastName: e.target.value,
                      })
                    }
                    placeholder="Pérez"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rut">Rut de la Persona</Label>
                  <Input
                    required
                    id="rut"
                    maxLength={12}
                    value={newPersonClient.rut}
                    onChange={(e) =>
                      setNewPersonClient({
                        ...newPersonClient,
                        rut: formatRutLive(e.target.value),
                      })
                    }
                    onBlur={() => handleRutBlurLocal(newPersonClient.rut)}
                    placeholder="24.889.273-0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    required
                    id="email"
                    value={newPersonClient.email}
                    onChange={(e) =>
                      setNewPersonClient({
                        ...newPersonClient,
                        email: e.target.value,
                      })
                    }
                    placeholder="juanperez@gmail.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    required
                    id="phone"
                    value={newPersonClient.phone}
                    onChange={(e) =>
                      setNewPersonClient({
                        ...newPersonClient,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+56 9 8765 4321"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Domicilio</Label>
                  <Input
                    required
                    id="address"
                    value={newPersonClient.address}
                    onChange={(e) =>
                      setNewPersonClient({
                        ...newPersonClient,
                        address: e.target.value,
                      })
                    }
                    placeholder="Av. Los Aroldos 143"
                  />
                </div>
              </>
            )}

            {clientType === "Juridica" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Nombre de la Compañia</Label>
                  <Input
                    required
                    id="companyName"
                    value={newCompanyClient.companyName}
                    onChange={(e) =>
                      setNewCompanyClient({
                        ...newCompanyClient,
                        companyName: e.target.value,
                      })
                    }
                    placeholder="Salesforce"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="legalRepresentative">
                    Representante Legal
                  </Label>
                  <Input
                    required
                    id="legalRepresentative"
                    value={newCompanyClient.legalRepresentative}
                    onChange={(e) =>
                      setNewCompanyClient({
                        ...newCompanyClient,
                        legalRepresentative: e.target.value,
                      })
                    }
                    placeholder="Juan Pablo Pérez"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rut-company">Rut de la Compañia</Label>
                  <Input
                    required
                    id="rut-company"
                    value={newCompanyClient.rut}
                    onChange={(e) =>
                      setNewCompanyClient({
                        ...newCompanyClient,
                        rut: formatRutLive(e.target.value),
                      })
                    }
                    onBlur={() => handleRutBlurLocal(newCompanyClient.rut)}
                    placeholder="77.233.445-7"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    required
                    id="email"
                    value={newCompanyClient.email}
                    onChange={(e) =>
                      setNewCompanyClient({
                        ...newCompanyClient,
                        email: e.target.value,
                      })
                    }
                    placeholder="administracion@salesforce.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    required
                    id="phone"
                    value={newCompanyClient.phone}
                    onChange={(e) =>
                      setNewCompanyClient({
                        ...newCompanyClient,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+56 9 8765 4321"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Direccion de la Compañia</Label>
                  <Input
                    required
                    id="address"
                    value={newCompanyClient.address}
                    onChange={(e) =>
                      setNewCompanyClient({
                        ...newCompanyClient,
                        address: e.target.value,
                      })
                    }
                    placeholder="Av. Los Caminos 472"
                  />
                </div>
              </>
            )}

            {/* Mensajes de ayuda/alerta */}
            {infoMsg && dupCandidate && (
              <p className="text-sm text-amber-700 bg-amber-100 border border-amber-200 rounded px-3 py-2">
                {infoMsg}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-1"
                  onClick={() => handleLink(dupCandidate.id)}
                >
                  Vincular ahora
                </Button>
              </p>
            )}
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <DialogFooter className="pt-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Agregar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
