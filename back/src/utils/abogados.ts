import { SeniorityLevel, typeOffLawyer } from "src/entities/lawyer.entity";


export const abogadosSeedData = [
  {
    name: 'Ana',
    lastname: 'García',
    adress: 'Calle Falsa 123',
    phone: '1122334455',
    rut: '12345678-9',
    type: typeOffLawyer.CIVIL, // Asegúrate de que 'tipo' sea SeniorityLevel si es lo que esperas, o cambia el nombre de la columna en la entidad si 'tipo' es para tipoAbogado
    seniorityLevel: SeniorityLevel.SENIOR,
    workedHours: 1500,
    userEmail: 'abogado3@example.com',
    // No incluyas 'id', 'usuario', 'casos', 'cronometros', o 'clientes' aquí.
    // 'usuario' se asociará después de crear el usuario.
  },
  {
    name: 'Luis',
    lastname: 'Martínez',
    adress: 'Avenida Siempre Viva 742',
    phone: '6677889900',
    rut: '98765432-1',
    type: typeOffLawyer.CRIMINAL,
    seniorityLevel: SeniorityLevel.MID,
    horasTrabajadas: 800,
    userEmail : 'abogado1@example.com'
  },
  {
    name: 'Sofía',
    lastname: 'Rodríguez',
    adress: 'Bulevar de los Sueños Rotos 45',
    phone: '2233445566',
    rut: '11223344-5',
    type: typeOffLawyer.FAMILIAR,
    seniorityLevel: SeniorityLevel.JUNIOR,
    horasTrabajadas: 200,
    userEmail: 'abogado2@example.com'
  },
];