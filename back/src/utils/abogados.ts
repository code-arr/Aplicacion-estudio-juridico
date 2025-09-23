import {  seniorityLevel, lawyerType } from "../entities/lawyer.entity";


export const abogadosSeedData = [
  {
    firstName: 'Ana',
    lastName: 'García',
    address: 'Calle Falsa 123',
    phone: '1122334455',
    rut: '12345678-9',
    type: lawyerType.CIVIL, // Asegúrate de que 'tipo' sea SeniorityLevel si es lo que esperas, o cambia el nombre de la columna en la entidad si 'tipo' es para tipoAbogado
    seniorityLevel: seniorityLevel.SENIOR,
    workedHours: 1500,
    userEmail: 'abogado3@example.com',
    // No incluyas 'id', 'usuario', 'casos', 'cronometros', o 'clientes' aquí.
    // 'usuario' se asociará después de crear el usuario.
  },
  {
    firstName: 'Luis',
    lastName: 'Martínez',
    address: 'Avenida Siempre Viva 742',
    phone: '6677889900',
    rut: '98765432-1',
    type: lawyerType.CRIMINAL,
    seniorityLevel: seniorityLevel.MID,
    horasTrabajadas: 800,
    userEmail : 'benjadelcampo15@gmail.com'
  },
  {
    firstName: 'Sofía',
    lastName: 'Rodríguez',
    address: 'Bulevar de los Sueños Rotos 45',
    phone: '2233445566',
    rut: '11223344-5',
    type: lawyerType.FAMILIAR,
    seniorityLevel: seniorityLevel.JUNIOR,
    horasTrabajadas: 200,
    userEmail: 'abogado2@example.com'
  },
];