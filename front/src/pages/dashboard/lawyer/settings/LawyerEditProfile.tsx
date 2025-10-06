import React, { useMemo, useState } from "react";
import type { Lawyer } from "@/types/Lawyer";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFocusContext } from "@/hooks/useFocusContext";

// === Utilidades cortas (sin libs) ===
const formatPhone = (v: string) =>
  v
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{3})(\d{0,4}).*/, "$1 $2 $3")
    .trim();

const isValidRut = (rut: string) => {
  // Validación simple: 7-8 dígitos + guion + dígito o k/K (no implementa DV completo para mantenerlo corto)
  return /^\d{7,8}-[\dkK]$/.test(rut);
};

export type LawyerEditProfileProps = {
  /** Se dispara con el payload listo para enviar */
  onSubmit?: (payload: Partial<Lawyer>) => Promise<void> | void;
  /** Campos que NO puede editar el abogado (además de role/email por defecto) */
  readOnlyFields?: Array<keyof Lawyer | "user.email" | "user.role" | "id">;
};

export default function LawyerEditProfile({
  onSubmit,
}: LawyerEditProfileProps) {
  useFocusContext({ type: "LawyerApp", id: "main" });

  const lawyer = useLawyerStore((s) => s.lawyer);
  const lawyerUser = useAuthStore((s) => s.user);
  const [form, setForm] = useState({
    firstName: lawyer?.firstName ?? "",
    lastName: lawyer?.lastName ?? "",
    address: lawyer?.address ?? "",
    phone: lawyer?.phone ?? "",
    rut: lawyer?.rut ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const changes = useMemo(() => {
    // Solo mandamos diff respecto a initial (payload más prolijo)
    const diff: Partial<Lawyer> = {};
    (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
      if ((lawyer as any)[k] !== (form as any)[k])
        (diff as any)[k] = (form as any)[k];
    });
    return diff;
  }, [form, lawyer]);

  const handleChange = (key: keyof typeof form, val: string | number) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Requerido";
    if (!form.lastName.trim()) e.lastName = "Requerido";
    if (!form.address.trim()) e.address = "Requerido";
    if (!form.phone.trim()) e.phone = "Requerido";
    if (!isValidRut(form.rut)) e.rut = "Formato RUT inválido (ej: 12345678-9)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      await onSubmit?.(changes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-t from-[#334155] via-[#3b4d66] to-[#60a5fa]/20 flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-3xl rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur px-6 py-7"
      >
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 grid place-items-center text-white text-xl font-semibold">
            {lawyer?.firstName?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
              Editar perfil
            </h1>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500">ID</p>
            <p className="text-sm font-medium text-slate-700 select-all">
              {lawyer?.id}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              className="inp"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="Juan"
            />
            {errors.firstName && (
              <p className="text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="Apellido">Apellido</Label>
            <Input
              className="inp"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Pérez"
            />
            {errors.lastName && (
              <p className="text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="Dirección" className="md:col-span-2">
              Dirección
            </Label>
            <Input
              className="inp"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Av. Siempre Viva 123"
            />
            {errors.address && (
              <p className="text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="Teléfono">Teléfono</Label>
            <Input
              className="inp"
              inputMode="tel"
              value={form.phone}
              onChange={(e) =>
                handleChange("phone", formatPhone(e.target.value))
              }
              placeholder="(11) 123 4567"
            />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="RUT">RUT</Label>
            <Input
              className="inp"
              value={form.rut}
              onChange={(e) => handleChange("rut", e.target.value)}
              placeholder="12345678-9"
              autoCapitalize="characters"
            />
            {errors.rut && (
              <p className="text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Campos de solo lectura provenientes de User */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="Tipo de abogado">Tipo de abogado</Label>
            <Input
              id="Tipo de abogado"
              className="inp capitalize"
              value={lawyer?.lawyerType ?? "—"}
              disabled
              readOnly
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="Seniority">Seniority</Label>
            <Input
              id="Seniority"
              className="inp capitalize"
              value={lawyer?.seniorityLevel ?? "—"}
              disabled
              readOnly
            />
            <p className="text-xs text-slate-400">
              Definido por el administrador
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              className="inp"
              value={lawyerUser?.email ?? "—"}
              disabled
              readOnly
            />
            <p className="text-xs text-slate-400">Vinculado a tu usuario</p>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="Rol">Rol del usuario </Label>
            <Input
              className="inp capitalize"
              value={lawyerUser?.role}
              disabled
              readOnly
            />
            <p className="text-xs text-slate-400">
              Definido por el administrador
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="googleEmail">Google Email</Label>
            <Input
              id="googleEmail"
              className="inp"
              value={
                lawyerUser?.googleEmail === "" ||
                lawyerUser?.googleEmail === undefined
                  ? "—"
                  : lawyerUser?.googleEmail
              }
              disabled
              readOnly
            />
            <p className="text-xs text-slate-400">Vinculado a tu usuario</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center gap-3 justify-end">
          <button
            type="button"
            className="btn ghost"
            onClick={() =>
              setForm({
                firstName: lawyer?.firstName ?? "",
                lastName: lawyer?.lastName ?? "",
                address: lawyer?.address ?? "",
                phone: lawyer?.phone ?? "",
                rut: lawyer?.rut ?? "",
              })
            }
          >
            Restablecer
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn primary disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

        {/* Styles utilitarios locales (Tailwind) */}
        <style>{`
            .inp { @apply w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-0 focus:border-slate-400 focus:bg-white/95 text-slate-800 placeholder:text-slate-400; }
            .btn { @apply inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition; }
            .btn.primary { @apply bg-indigo-600 text-white hover:bg-indigo-700 shadow; }
            .btn.ghost { @apply bg-transparent text-slate-700 hover:bg-slate-100; }
          `}</style>
      </form>
    </div>
  );
}
