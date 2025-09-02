 // Asegúrate de ajustar la ruta a tu archivo de entidad

import { UserRole } from "../entities/user.entity";

export const usersSeedData = [
  {
    email: 'admin@example.com',
    password: 'hashedpasswordAdmin123', // ¡Recuerda hashear esta contraseña!
    role: UserRole.ADMIN,
  },
  {
    email: 'benjadelcampo15@gmail.com',
    password: 'hashedpasswordAbogado456', // ¡Recuerda hashear esta contraseña!
    role: UserRole.LAWYER,
  },
  {
    email: 'abogado2@example.com',
    password: 'hashedpasswordAbogado789',
    role: UserRole.LAWYER,
  },
  {
    email: 'abogado3@example.com',
    password: 'hashedpasswordAbogadoabc',
    role: UserRole.LAWYER,
  },
];