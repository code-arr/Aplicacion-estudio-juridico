import { SeniorityLevel, tipoAbogado } from "src/entities/abogado.entity";


export const abogadosSeedData = [
  {
    nombre: 'Ana',
    apellido: 'García',
    direccion: 'Calle Falsa 123',
    telefono: '1122334455',
    rut: '12345678-9',
    tipoAbogado: tipoAbogado.CIVIL, // Asegúrate de que 'tipo' sea SeniorityLevel si es lo que esperas, o cambia el nombre de la columna en la entidad si 'tipo' es para tipoAbogado
    seniorityLevel: SeniorityLevel.SENIOR,
    horasTrabajadas: 1500,
    userEmail: 'abogado3@example.com',
    // No incluyas 'id', 'usuario', 'casos', 'cronometros', o 'clientes' aquí.
    // 'usuario' se asociará después de crear el usuario.
  },
  {
    nombre: 'Luis',
    apellido: 'Martínez',
    direccion: 'Avenida Siempre Viva 742',
    telefono: '6677889900',
    rut: '98765432-1',
    tipoAbogado: tipoAbogado.CRIMINAL,
    seniorityLevel: SeniorityLevel.MID,
    horasTrabajadas: 800,
    userEmail : 'abogado1@example.com'
  },
  {
    nombre: 'Sofía',
    apellido: 'Rodríguez',
    direccion: 'Bulevar de los Sueños Rotos 45',
    telefono: '2233445566',
    rut: '11223344-5',
    tipoAbogado: tipoAbogado.FAMILIAR,
    seniorityLevel: SeniorityLevel.JUNIOR,
    horasTrabajadas: 200,
    userEmail: 'abogado2@example.com'
  },
];