import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChangePasswordDialogProps {
  pwdOpen: boolean;
  setPwdOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChangePasswordDialog = ({
  pwdOpen,
  setPwdOpen,
}: ChangePasswordDialogProps) => {
  const [pwdStep, setPwdStep] = useState<"verify" | "set">("verify");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  async function handleVerifyCurrentPassword(current: string) {
    try {
      setPwdLoading(true);
      setPwdError(null);
      /* await api.auth.verifyPassword({ password: current }); */ // 200 si ok
      setPwdStep("set");
    } catch {
      setPwdError("La contraseña actual no es correcta.");
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleChangePassword(newPwd: string, confirm: string) {
    if (newPwd !== confirm) {
      setPwdError("Las contraseñas no coinciden.");
      return;
    }
    // valida fuerza mínima si querés
    try {
      setPwdLoading(true);
      setPwdError(null);
      /* await api.auth.changePassword({ newPassword: newPwd }); */
      // opcional: await api.auth.logoutOthers();
      // toast success
      setPwdOpen(false);
      setPwdStep("verify");
    } catch {
      setPwdError("No se pudo actualizar la contraseña. Probá de nuevo.");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <Dialog
      open={pwdOpen}
      onOpenChange={(v) => {
        setPwdOpen(v);
        if (!v) {
          setPwdStep("verify");
          setPwdError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            {pwdStep === "verify"
              ? "Por seguridad, primero verificá tu contraseña actual."
              : "Ingresá tu nueva contraseña."}
          </DialogDescription>
        </DialogHeader>

        {pwdStep === "verify" ? (
          <VerifyStep
            loading={pwdLoading}
            error={pwdError}
            onSubmit={handleVerifyCurrentPassword}
          />
        ) : (
          <SetStep
            loading={pwdLoading}
            error={pwdError}
            onSubmit={handleChangePassword}
          />
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setPwdOpen(false);
              setPwdStep("verify");
            }}
          >
            Cancelar
          </Button>
          {/* El botón principal está dentro de cada <form> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function VerifyStep({
  loading,
  error,
  onSubmit,
}: {
  loading: boolean;
  error: string | null;
  onSubmit: (pwd: string) => void;
}) {
  const [pwd, setPwd] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(pwd);
      }}
      className="space-y-3"
    >
      <Input
        type="password"
        placeholder="Contraseña actual"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading || !pwd}>
        {loading ? "Verificando..." : "Continuar"}
      </Button>
    </form>
  );
}

function SetStep({
  loading,
  error,
  onSubmit,
}: {
  loading: boolean;
  error: string | null;
  onSubmit: (pwd: string, confirm: string) => void;
}) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(pwd, confirm);
      }}
      className="space-y-3"
    >
      <Input
        type="password"
        placeholder="Nueva contraseña"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Confirmar nueva"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading || !pwd || !confirm}>
        {loading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}

export default ChangePasswordDialog;
