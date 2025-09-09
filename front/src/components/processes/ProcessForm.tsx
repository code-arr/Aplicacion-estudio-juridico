import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useState } from "react";

type ProcessFormProps = {
  isDialogOpen: boolean;
  onOpenChange: (open: boolean) => void; // <— firma exacta que pide Dialog
};

type NewProcess = {
  date: string;
  name: string;
  description: string;
  duration: number | null; // en minutos
};

const initialItemState: NewProcess = {
  date: "",
  name: "",
  description: "",
  duration: null,
};

const ProcessForm = ({ isDialogOpen, onOpenChange }: ProcessFormProps) => {
  const [newProcess, setNewProcess] = useState<NewProcess>(initialItemState);

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setNewProcess(initialItemState);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Trámite</DialogTitle>
          <DialogDescription>
            Registrar un nuevo trámite realizado fuera del estudio.
          </DialogDescription>
        </DialogHeader>

        {/* Nombre */}
        <div className="py-4">
          <Label htmlFor="name">Nombre</Label>
          <Input
            type="text"
            id="name"
            value={newProcess.name}
            onChange={(e) =>
              setNewProcess({ ...newProcess, name: e.target.value })
            }
          />
        </div>

        <div className="grid gap-4">
          {/* Fecha */}
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              type="date"
              id="date"
              value={newProcess.date}
              onChange={(e) =>
                setNewProcess({ ...newProcess, date: e.target.value })
              }
            />
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              className="w-full border rounded p-2"
              rows={3}
              value={newProcess.description}
              onChange={(e) =>
                setNewProcess({ ...newProcess, description: e.target.value })
              }
            />
          </div>

          {/* Duración */}
          <div>
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              type="number"
              id="duration"
              value={newProcess.duration ?? ""}
              onChange={(e) =>
                setNewProcess({
                  ...newProcess,
                  duration: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessForm;
