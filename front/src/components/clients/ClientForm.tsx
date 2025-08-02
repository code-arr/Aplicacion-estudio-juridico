import { useState } from "react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import {
  SegmentedToggle,
  SegmentedToggleItem,
} from "@components/ui/segmentedtoggle";

type ClientFormProps = {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ClientForm = ({ isDialogOpen, setIsDialogOpen }: ClientFormProps) => {
  const [clientType, setClientType] = useState("juridico");
  const [newCompanyClient, setNewCompanyClient] = useState({
    companyName: "",
    legalRepresentative: "",
    rut: "",
    email: "",
    address: "",
  });
  const [newPersonClient, setNewPersonClient] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    email: "",
    address: "",
  });
  const handleAddClient = () => {};

  function formatRutLive(value: string) {
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
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Complete la información del cliente para comenzar a gestionar su
            caso.
          </DialogDescription>
        </DialogHeader>
        <SegmentedToggle
          type="single"
          value={clientType}
          onValueChange={(value) => value && setClientType(value)}
          onClick={() => {
            setNewCompanyClient({
              companyName: "",
              legalRepresentative: "",
              rut: "",
              email: "",
              address: "",
            });
            setNewPersonClient({
              firstName: "",
              lastName: "",
              rut: "",
              email: "",
              address: "",
            });
          }}
        >
          <SegmentedToggleItem
            value="juridico"
            onChange={() => setClientType("juridico")}
          >
            Persona Juridica
          </SegmentedToggleItem>
          <SegmentedToggleItem
            value="fisico"
            onChange={() => setClientType("fisico")}
          >
            Persona Fisica
          </SegmentedToggleItem>
        </SegmentedToggle>

        <div className="grid gap-4 py-4">
          {clientType === "fisico" && (
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

          {clientType === "juridico" && (
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
                <Label htmlFor="legalRepresentative">Representante Legal</Label>
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
                <Label htmlFor="rut">Rut de la Compañia</Label>
                <Input
                  required
                  id="rut"
                  value={newCompanyClient.rut}
                  onChange={(e) =>
                    setNewCompanyClient({
                      ...newCompanyClient,
                      rut: formatRutLive(e.target.value),
                    })
                  }
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
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleAddClient}>
            Agregar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientForm;
