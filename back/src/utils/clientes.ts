// src/utils/clientes.ts

import { Cliente } from '../entities/cliente.entity'; // Importa la entidad Cliente para tipar el array

// Define una interfaz para los ítems del seeder, extendiendo Partial<Cliente>
// Esto es útil para incluir campos temporales para el seeder, como el email del abogado asociado.
interface ClienteSeedItem extends Partial<Cliente> {
  abogadoAsociadoEmail?: string; // Campo opcional para el email del abogado a asociar
}

// Este array de clientes servirá para tu seeder
// Las relaciones (casos, cronometros) se manejarán en otros seeders o al crear el caso/cronometro.
export const clientesSeedData: ClienteSeedItem[] = [
  {
    name: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    phone: '1122334455',
    address: 'Calle Falsa 123, Ciudad A',
    rut: '12.345.678-9',
    abogadoAsociadoEmail: 'abogado1@example.com', // Asociado a Abogado 1
  },
  {
    name: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@example.com',
    phone: '2233445566',
    address: 'Avenida Siempre Viva 456, Ciudad B',
    rut: '98.765.432-1',
    abogadoAsociadoEmail: 'abogado2@example.com', // Asociado a Abogado 2
  },
  {
    name: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@example.com',
    phone: '3344556677',
    address: "Avenida los Libertadores",
    rut: '11.222.333-4',
    abogadoAsociadoEmail: 'abogado3@example.com', // Asociado a Abogado 3
  },
  {
    name: 'Laura',
    lastName: 'Martínez',
    email: 'laura.martinez@example.com',
    phone: '4455667788',
    address: 'Plaza Mayor 789, Ciudad C',
    rut: '44.555.666-7',
    abogadoAsociadoEmail: 'abogado1@example.com', // Asociado a Abogado 1
  },
  {
    name: 'Pedro',
    lastName: 'Sánchez',
    email: 'pedro.sanchez@example.com',
    phone: '5566778899',
    address: 'Bulevar de los Sueños 101, Ciudad D',
    rut: '77.888.999-0',
    abogadoAsociadoEmail: 'abogado2@example.com', // Asociado a Abogado 2
  },
  {
    name: 'Ana',
    lastName: 'Díaz',
    email: 'ana.diaz@example.com',
    phone: '6677889900',
    address: "Calle terrada 2881",
    rut: '22.333.444-5',
    abogadoAsociadoEmail: 'abogado3@example.com', // Asociado a Abogado 3
  },
  {
    name: 'Luis',
    lastName: 'Ramírez',
    email: 'luis.ramirez@example.com',
    phone: '7788990011',
    address: 'Callejón del Gato 202, Ciudad E',
    rut: '55.666.777-8',
    abogadoAsociadoEmail: 'abogado1@example.com', // Asociado a Abogado 1
  },
  {
    name: 'Sofía',
    lastName: 'Fernández',
    email: 'sofia.fernandez@example.com',
    phone: '8899001122',
    address: 'Paseo de la Luna 303, Ciudad F',
    rut: '88.999.000-1',
    abogadoAsociadoEmail: 'abogado2@example.com', // Asociado a Abogado 2
  },
  {
    name: 'Miguel',
    lastName: 'López',
    email: 'miguel.lopez@example.com',
    phone: '9900112233',
    address: 'Ruta del Sol 404, Ciudad G',
    rut: '33.444.555-6',
    abogadoAsociadoEmail: 'abogado3@example.com', // Asociado a Abogado 3
  },
  {
    name: 'Elena',
    lastName: 'Gómez',
    email: 'elena.gomez@example.com',
    phone: '0011223344',
    address: 'Alameda Principal 505, Ciudad H',
    rut: '66.777.888-9',
    abogadoAsociadoEmail: 'abogado1@example.com', // Asociado a Abogado 1
  },
];