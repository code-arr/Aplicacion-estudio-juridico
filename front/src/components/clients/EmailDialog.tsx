import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendDocument } from "@/api/client"; // <- esta función debe usar FormData y campo 'contractFile'
import { useAuthStore } from "@/store/useAuthStore";

type EmailDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  toEmail: string;
};

const MAX_MB = 15;

export default function EmailDialog({
  isOpen,
  onOpenChange,
  toEmail,
}: EmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState(""); // <- esto va como description al back
  const [title, setTitle] = useState(""); // <- faltaba
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const lawyerEmail = user?.email ?? "";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setFile(null);

    // validación simple de tamaño (opcional)
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > MAX_MB) {
      setError(`El archivo supera ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
  }

  async function handleSend() {
    setError(null);

    if (!subject.trim() || !message.trim() || !title.trim()) {
      setError("Completá asunto, mensaje y título.");
      return;
    }
    if (!lawyerEmail) {
      setError("No se encontró el email del abogado (lawyerEmail).");
      return;
    }

    try {
      setSending(true);
      await sendDocument({
        email: toEmail, // destinatario
        subject, // asunto
        description: message, // el back espera 'description'
        title, // título del documento
        contractFile: file, // nombre exacto para FileInterceptor('contractFile')
        lawyerEmail, // va por query en tu controlador
      });
      onOpenChange(false);
      // opcional: limpiar estado
      setSubject("");
      setMessage("");
      setTitle("");
      setFile(null);
    } catch {
      setError("No se pudo enviar el mail. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  const disabled =
    sending || !subject.trim() || !message.trim() || !title.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar mail al cliente</DialogTitle>
          <DialogDescription>
            Podés adjuntar un documento (opcional).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Para</Label>
            <Input value={toEmail} disabled />
          </div>

          <div className="grid gap-2">
            <Label>Asunto</Label>
            <Input
              placeholder="Asunto del correo"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Mensaje</Label>
            <Textarea
              placeholder="Escribí el mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>

          <div className="grid gap-2">
            <Label>Título del documento</Label>
            <Input
              placeholder="Ej: Contrato de servicios"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Adjunto (opcional)</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} — {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={disabled}>
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
