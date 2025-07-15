 // Asegúrate de ajustar la ruta a tu archivo de entidad

import { UserRole } from "src/entities/usuario.entity";

export const usersSeedData = [
  {
    email: 'admin@example.com',
    password: 'hashedpasswordAdmin123', // ¡Recuerda hashear esta contraseña!
    role: UserRole.ADMIN,
  },
  {
    email: 'abogado1@example.com',
    password: 'hashedpasswordAbogado456', // ¡Recuerda hashear esta contraseña!
    role: UserRole.ABOGADO,
  },
  {
    email: 'abogado2@example.com',
    password: 'hashedpasswordAbogado789',
    role: UserRole.ABOGADO,
  },
  {
    email: 'abogado3@example.com',
    password: 'hashedpasswordAbogadoabc',
    role: UserRole.ABOGADO,
  },
];