import {  , lawyerType } from "../entities/lawyer.entity";


export const abogadosSeedData = [
  {
    firstName: 'Ana',
    lastName: 'García',
    address: 'Calle Falsa 123',
    phone: '1122334455',
    rut: '12345678-9',
    type: lawyerType.CIVIL, 
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
  
    horasTrabajadas: 200,
    userEmail: 'abogado2@example.com'
  },
];