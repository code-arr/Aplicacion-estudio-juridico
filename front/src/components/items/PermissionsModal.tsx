// src/components/items/PermissionsModal.tsx (reemplazar)
import { useState, useEffect } from "react";
import type { ClientItem } from "@/types/ClientItem";
import { useLawyerStore } from "@/store/useLawyerStore";
import { useClientItemStore } from "@/store/useClientItemStore";
import { updateClientItemAccess } from "@/api/clientItem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

interface Props {
  item: ClientItem;
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionsModal = ({ item, isOpen, onClose }: Props) => {
  const [isPrivate, setIsPrivate] = useState(Boolean(item.isPrivate));
  const [selectedLawyerIds, setSelectedLawyerIds] = useState<string[]>([]);
  const lawyers = useLawyerStore((s) => s.lawyers);
  const fetchAllLawyers = useLawyerStore((s) => s.fetchAllLawyers);
  const fetchClientItemsByClientId = useClientItemStore(
    (s) => s.fetchClientItemsByClientId
  );
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Cargar abogados al abrir
  useEffect(() => {
    if (isOpen) fetchAllLawyers();
  }, [isOpen, fetchAllLawyers]);

  // Sincronizar estado con el item actual
  useEffect(() => {
    setIsPrivate(Boolean(item.isPrivate));
    const sharedIds = (item.sharedWithLawyers ?? []).map((l) => l.id);
    setSelectedLawyerIds(sharedIds);
  }, [item]);

  const handleToggleCheckbox = (lawyerId: string) => {
    setSelectedLawyerIds((prev) =>
      prev.includes(lawyerId)
        ? prev.filter((id) => id !== lawyerId)
        : [...prev, lawyerId]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (!item.id) throw new Error("Ítem inválido (falta id)");

      const ownerId = item.lawyerId;
      // combinación y filtrado con type-guard para garantizar string[]
      const mixed = isPrivate ? [...selectedLawyerIds, ownerId] : [];
      const sharedLawyerIds = Array.from(
        new Set(mixed.filter((id): id is string => typeof id === "string"))
      );

      const payload = {
        isPrivate: item.isPrivate as boolean,
        sharedLawyerIds,
      };

      await updateClientItemAccess(item.id, payload);
      await fetchClientItemsByClientId(item.clientId);
      toast({ title: "Permisos actualizados" });
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Error al guardar permisos" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permisos del caso "{item.title}"</DialogTitle>
          <DialogDescription>
            Gestiona quién puede ver y editar este ítem.
          </DialogDescription>
        </DialogHeader>

        {!isPrivate ? (
          <div className="py-2">
            <p className="text-sm text-gray-600">
              Este ítem es <strong>público</strong> y está disponible para todo
              el estudio.
            </p>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-gray-600 mb-2">
              Este ítem es <strong>privado</strong>. Seleccioná los abogados que
              pueden participar:
            </p>

            <div className="space-y-2 max-h-56 overflow-auto border rounded p-2">
              <div className="text-sm text-muted-foreground mb-2">
                Seleccioná con qué abogados compartir (el propietario siempre
                tiene acceso)
              </div>

              {(lawyers ?? [])
                .filter((l) => l.id !== item.lawyerId)
                .map((lawyer) => {
                  const checked = selectedLawyerIds.includes(lawyer.id);
                  const inputId = `perm-${item.id}-${lawyer.id}`;
                  return (
                    <div
                      key={lawyer.id}
                      className="flex items-center gap-2 py-1"
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleCheckbox(lawyer.id)}
                        className="w-4 h-4"
                        aria-label={`Compartir con ${lawyer.firstName} ${lawyer.lastName}`}
                      />
                      <Label
                        htmlFor={inputId}
                        className="text-sm cursor-pointer"
                      >
                        {`${lawyer.firstName} ${lawyer.lastName}`}
                      </Label>
                    </div>
                  );
                })}

              {(!lawyers || lawyers.length === 0) && (
                <div className="text-sm text-gray-500">
                  No hay abogados cargados.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !isPrivate} // deshabilitado si no es privado
            title={!isPrivate ? "Solo disponible para ítems privados" : ""}
          >
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
