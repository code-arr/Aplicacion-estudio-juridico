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
import { createClient } from "@/api/client";
import type { Client, ClientType } from "@/types/Client";
import { selectClientsByLawyer, useClientStore } from "@/store/useClientStore";
import { useLawyerStore } from "@/store/useLawyerStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { linkClientToLawyer } from "@/api/lawyer";
import { useToast } from "@/hooks/useToast";

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
  const { toast } = useToast();

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
  const hydrateAllClients = useClientStore((state) => state.hydrateAll);
  const actualLawyerClients = useClientStore(selectClientsByLawyer);
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
    currency: "CLP" as "CLP" | "USD" | "UF",
    hourlyRate: "", // lo guardamos como string para el back
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
    currency: "CLP" as "CLP" | "USD" | "UF",
    hourlyRate: "",
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

  // Permitimos que la tarifa esté vacía. Solo valida si el usuario escribió algo.
  const validateRate = (rateStr: string) => {
    if (!rateStr) return null; // Es opcional ahora
    const n = Number(rateStr);
    if (!Number.isFinite(n) || n <= 0)
      return "Si ingresás una tarifa, debe ser mayor a 0";
    return null;
  };

  // Validamos SOLO identidad (Nombre/Razón Social) y RUT
  function validate(): string | null {
    if (clientType === "Fisica") {
      const c = newPersonClient;
      if (!c.firstName || !c.lastName)
        return "Nombre y apellido son requeridos";
      //if (!c.rut || !validateRut(c.rut)) return "RUT inválido o requerido";
      if (c.rut && !validateRut(c.rut)) return "RUT inválido";

      // Chequeo opcional de tarifa (solo si escribieron algo)
      const rateErr = validateRate(c.hourlyRate);
      if (rateErr) return rateErr;

      return null;
    }

    // Caso Jurídica
    const c = newCompanyClient;
    if (!c.companyName) return "Nombre de la compañía es requerido";
    // Representante legal ahora es opcional según tu pedido
    //if (!c.rut || !validateRut(c.rut)) return "RUT inválido o requerido";
    if (c.rut && !validateRut(c.rut)) return "RUT inválido";

    if (c.email && !isValidEmail(c.email)) {
      return "El formato del email no es válido";
    }

    // Chequeo opcional de tarifa
    const rateErr = validateRate(c.hourlyRate);
    if (rateErr) return rateErr;

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
      currency: "CLP",
      hourlyRate: "",
    });
    setNewPersonClient({
      firstName: "",
      lastName: "",
      rut: "",
      phone: "",
      email: "",
      address: "",
      type: "Fisica",
      currency: "CLP",
      hourlyRate: "",
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

      // 1. Seleccionamos el state correcto según el tipo
      const currentData =
        clientType === "Juridica" ? newCompanyClient : newPersonClient;

      // 2. Limpiamos el valor de la tarifa
      const rawRate = currentData.hourlyRate.trim();
      // Si está vacío, mandamos null.
      // Si tiene algo, lo dejamos como string (TypeORM lo prefiere así para 'numeric')
      const cleanRate = rawRate === "" ? null : rawRate;

      const dto = {
        ...currentData,
        currency: currentData.currency,
        hourlyRate: cleanRate, // Ahora sí: string | null
      };

      await createClient(dto as Client);
      reset();

      await hydrateByLawyer(lawyerId!, { force: true });

      setIsDialogOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "No se pudo crear el cliente";
      setErrorMsg(msg);
      toast({
        variant: "destructive",
        title: "Error al crear el cliente",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Vincular existente (desde resultados de búsqueda o banner de RUT)
  const handleLink = async (clientId: string | undefined) => {
    if (!clientId) {
      setErrorMsg("No se indicó el ID del cliente a vincular");
      toast({
        variant: "destructive",
        title: "No se pudo vincular",
        description: "Falta el ID del cliente.",
      });
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await linkClientToLawyer(clientId);
      reset();

      await hydrateByLawyer(lawyerId!, { force: true });

      toast({
        title: "Cliente vinculado",
        description: "Se agregó a tu lista correctamente.",
      });

      setIsDialogOpen(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "No se pudo vincular el cliente";
      setErrorMsg(msg);
      toast({
        variant: "destructive",
        title: "Error al vincular",
        description: msg,
      });
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

  useEffect(() => {
    if (!isDialogOpen) return;

    (async () => {
      // si no tenés flags de hidratación, usá length como guardia simple
      if (!clients?.length) {
        await hydrateAllClients({ force: false }); // o true si querés ignorar TTL
      }
      if (lawyerId && !actualLawyerClients?.length) {
        await hydrateByLawyer(lawyerId, { force: false });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen || mode !== "vincular") return;

    if (!clients?.length) {
      hydrateAllClients({ force: false });
    }
    if (lawyerId && !actualLawyerClients?.length) {
      hydrateByLawyer(lawyerId, { force: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isDialogOpen]);

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
      <DialogContent className="p-0 max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-white z-10">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Complete la información del cliente para comenzar a gestionar su
              caso.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 overflow-y-auto flex-1 pr-2 [scrollbar-gutter:stable]">
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
                      disabled={
                        !clients?.length || !actualLawyerClients?.length
                      }
                    />
                    {errorMsg && (
                      <div className="mt-2 text-sm text-red-600">
                        {errorMsg}
                      </div>
                    )}
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
                                  disabled={loading}
                                >
                                  {loading ? "Vinculando..." : "Vincular"}
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
            <form
              id="client-form"
              onSubmit={handleAddClient}
              className="grid gap-4 pt-4 pb-2"
            >
              <SegmentedToggle
                className="max-w-md"
                type="single"
                value={clientType}
                onValueChange={(value) =>
                  value &&
                  (setClientType(value as ClientType), setInfoMsg(null))
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
                  {/* ====== Facturación ====== */}
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Moneda</Label>

                    <Select
                      value={newPersonClient.currency}
                      onValueChange={(value: "CLP" | "USD" | "UF") => {
                        setNewPersonClient({
                          ...newPersonClient,
                          currency: value,
                        });
                      }}
                    >
                      <SelectTrigger id="currency" className="w-full">
                        <SelectValue placeholder="Seleccioná la moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                        <SelectItem value="USD">USD (Dólar)</SelectItem>
                        <SelectItem value="UF">UF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="hourlyRate">Tarifa por hora</Label>
                    <Input
                      id="hourlyRate"
                      inputMode="decimal"
                      placeholder={
                        newPersonClient.currency === "CLP"
                          ? "Ej: 55000"
                          : "Ej: 75.5"
                      }
                      value={newPersonClient.hourlyRate}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", "."); // acepta coma
                        setNewPersonClient({
                          ...newPersonClient,
                          hourlyRate: v,
                        });
                      }}
                    />
                    <p className="text-xs text-[hsl(225,10%,50%)]">
                      Se mostrará como “{newPersonClient.currency}{" "}
                      {newPersonClient.hourlyRate || "—"} / hora”.
                    </p>
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
                  {/* ====== Facturación ====== */}
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Moneda</Label>

                    <Select
                      value={newCompanyClient.currency}
                      onValueChange={(value: "CLP" | "USD" | "UF") => {
                        setNewCompanyClient({
                          ...newCompanyClient,
                          currency: value,
                        });
                      }}
                    >
                      <SelectTrigger id="currency" className="w-full">
                        <SelectValue placeholder="Seleccioná la moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                        <SelectItem value="USD">USD (Dólar)</SelectItem>
                        <SelectItem value="UF">UF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="hourlyRate">Tarifa por hora</Label>
                    <Input
                      id="hourlyRate"
                      inputMode="decimal"
                      placeholder={
                        newCompanyClient.currency === "CLP"
                          ? "Ej: 55000"
                          : "Ej: 75.5"
                      }
                      value={newCompanyClient.hourlyRate}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", "."); // acepta coma
                        setNewCompanyClient({
                          ...newCompanyClient,
                          hourlyRate: v,
                        });
                      }}
                    />
                    <p className="text-xs text-[hsl(225,10%,50%)]">
                      Se mostrará como “{newCompanyClient.currency}{" "}
                      {newCompanyClient.hourlyRate || "—"} / hora”.
                    </p>
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
            </form>
          )}
        </div>
        <div className="px-6 py-3 bg-white z-10">
          <DialogFooter>
            <Button type="submit" form="client-form" disabled={loading}>
              {loading ? "Guardando..." : "Agregar Cliente"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
