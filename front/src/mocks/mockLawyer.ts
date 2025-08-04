import type { Lawyer } from "@/types/Lawyer";

export const mockLawyer: Lawyer = {
  id: "bfc6606a-2264-4388-9af7-3262904c00b8",
  firstname: "Luis",
  lastname: "Martínez",
  address: "Avenida Siempre Viva 742",
  phone: "6677889900",
  rut: "98765432-1",
  lawyerType: "criminal",
  seniorityLevel: "mid",
  hoursWorked: 800,
  cases: [
    {
      id: "d67a72d1-0183-4601-8f45-cabf1b5e3fa9",
      title: "Divorcio Express de los Pérez",
      description:
        "Caso de divorcio mutuo acuerdo, sin hijos ni bienes compartidos complejos.",
      documents: null,
      meetings: null,
      /* cliente: {
        id: "2677cc95-a36e-4a74-98a2-5f11beabd606",
        name: "Juan",
        lastName: "Pérez",
        email: "juan.perez@example.com",
        phone: "1122334455",
        address: "Calle Falsa 123, Ciudad A",
        rut: "12.345.678-9",
      }, */
    },
    {
      id: "74c108eb-dbe9-4f3c-bd8c-52aef06ae583",
      title: "Asesoramiento Laboral - Despido Injustificado",
      description:
        "Asesoramiento y representación en caso de despido sin causa justificada.",
      documents: null,
      meetings: null,
      /* cliente: {
        id: "573710a6-a2e8-42a5-8f1f-23802ff24a01",
        name: "María",
        lastName: "González",
        email: "maria.gonzalez@example.com",
        phone: "2233445566",
        address: "Avenida Siempre Viva 456, Ciudad B",
        rut: "98.765.432-1",
      }, */
    },
    {
      id: "b13f4408-8670-4bb4-96da-9ce7e3b3dbe7",
      title: "Herencia y Sucesión - Familia Ramírez",
      description:
        "Asesoramiento y gestión de trámites para la partición de bienes y sucesión tras el fallecimiento de un familiar.",
      documents: null,
      meetings: null,
      /* cliente: {
        id: "0573205a-8539-4b09-a4ac-b271e8188a17",
        name: "Sofía",
        lastName: "Fernández",
        email: "sofia.fernandez@example.com",
        phone: "8899001122",
        address: "Paseo de la Luna 303, Ciudad F",
        rut: "88.999.000-1",
      }, */
    },
    {
      id: "1d0fa041-5e75-4069-bff9-f0ad9838ae40",
      title: 'Contrato de Arrendamiento Comercial - "Café Central"',
      description:
        "Revisión y negociación de contrato de alquiler para nuevo local de cafetería en el centro.",
      documents: null,
      meetings: null,
      /* cliente: {
        id: "ffbf3261-3bdc-41d5-abda-a7c833f21585",
        name: "Elena",
        lastName: "Gómez",
        email: "elena.gomez@example.com",
        phone: "0011223344",
        address: "Alameda Principal 505, Ciudad H",
        rut: "66.777.888-9",
      }, */
    },
  ],
};
