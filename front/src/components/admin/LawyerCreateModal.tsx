// src/components/admin/LawyerCreateModal.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RegisterPayload } from "@/api/user";
import { createLawyerWithUser } from "@/api/user";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (created: any) => void; // mantengo any para flexibilidad
};

export default function LawyerCreateModal({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [rut, setRut] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null; // modal muy simple (si usas librería modal, reemplaza)

  const submit = async () => {
    setErr(null);
    if (!email || !password || !firstName) {
      setErr("Email, contraseña y nombre son requeridos");
      return;
    }
    setLoading(true);
    const payload: RegisterPayload = {
      user: { email, password },
      lawyer: {
        firstName,
        lastName,
        phone,
        rut,
      },
    };
    try {
      const created = await createLawyerWithUser(payload);
      onCreated?.(created);
      // limpiar y cerrar
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setRut("");
      onOpenChange(false);
      alert("Abogado creado correctamente");
    } catch (e: any) {
      setErr(e?.message || "Error al crear abogado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg p-6 w-full max-w-xl">
        <h3 className="text-lg font-semibold mb-4">Crear abogado & usuario</h3>

        {err && <div className="text-sm text-red-600 mb-2">{err}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Input
            placeholder="Email (usuario)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            placeholder="RUT"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
          />
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Creando…" : "Crear abogado"}
          </Button>
        </div>
      </div>
      {/* fondo semi-transparente */}
      <div
        className="fixed inset-0 bg-black opacity-30"
        onClick={() => onOpenChange(false)}
      />
    </div>
  );
}
