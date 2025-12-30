import { useState, useEffect } from "react";
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
import { sendDocument } from "@/api/client";
import { getDocumentsByClientId } from "@/api/document"; // 👈 CAMBIADO
import { useAuthStore } from "@/store/useAuthStore";
import type { Document } from "@/types/Document";

type EmailDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  toEmail: string;
  clientId: string;
};

const MAX_MB = 50;

export default function EmailDialog({
  isOpen,
  onOpenChange,
  toEmail,
  clientId, // 👈 CAMBIADO
}: EmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"saved" | "upload">("saved");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [savedDocs, setSavedDocs] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const user = useAuthStore((s) => s.user);
  const lawyerEmail = user?.email ?? "";

  // 👇 Cargar documentos del cliente completo
  useEffect(() => {
    if (isOpen && clientId) {
      loadSavedDocuments();
    } else {
      setSavedDocs([]);
      setSelectedDocIds([]);
    }
  }, [isOpen, clientId]);

  async function loadSavedDocuments() {
    setLoadingDocs(true);
    setError(null);
    try {
      const docs = await getDocumentsByClientId(clientId); // 👈 CAMBIADO
      setSavedDocs(docs);
    } catch (err) {
      console.error("❌ [EmailDialog] Error cargando docs:", err);
      setError("No se pudieron cargar los documentos guardados.");
    } finally {
      setLoadingDocs(false);
    }
  }

  function toggleDocSelection(docId: string) {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setFile(null);

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

    if (selectedDocIds.length === 0 && !file) {
      setError("Seleccioná al menos un documento o subí uno nuevo.");
      return;
    }

    if (!lawyerEmail) {
      setError("No se encontró el email del abogado.");
      return;
    }

    try {
      setSending(true);
      await sendDocument({
        email: toEmail,
        subject,
        description: message,
        title,
        documentIds: selectedDocIds,
        contractFile: file,
        lawyerEmail,
      });
      onOpenChange(false);

      setSubject("");
      setMessage("");
      setTitle("");
      setFile(null);
      setSelectedDocIds([]);
      setActiveTab("saved");
    } catch {
      setError("No se pudo enviar el mail. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  const disabled =
    sending ||
    !subject.trim() ||
    !message.trim() ||
    !title.trim() ||
    (selectedDocIds.length === 0 && !file);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar mail al cliente</DialogTitle>
          <DialogDescription>
            Seleccioná documentos guardados o subí uno nuevo.
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
              rows={4}
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

          {/* TABS */}
          <div className="border-t pt-4">
            <div className="flex gap-2 border-b mb-4">
              <button
                onClick={() => setActiveTab("saved")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "saved"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Documentos guardados ({selectedDocIds.length})
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "upload"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Subir nuevo {file && "✓"}
              </button>
            </div>

            {activeTab === "saved" ? (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {loadingDocs ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">
                      Cargando documentos...
                    </p>
                  </div>
                ) : savedDocs.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">
                      No hay documentos guardados en este cliente
                    </p>
                  </div>
                ) : (
                  savedDocs.map((doc) => (
                    <label
                      key={doc.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDocIds.includes(doc.id)
                          ? "bg-blue-50 border-blue-300"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.id)}
                        onChange={() => toggleDocSelection(doc.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Versión {doc.currentVersion}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Adjunto nuevo</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                {file && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                    <span className="font-medium truncate flex-1">
                      {file.name}
                    </span>
                    <span className="text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
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

/* import { useState } from "react";
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

const MAX_MB = 50;

export default function EmailDialog({
  isOpen,
  onOpenChange,
  toEmail,
}: EmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState(""); // <- esto va como description al back
  const [title, setTitle] = useState("");
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
 */
