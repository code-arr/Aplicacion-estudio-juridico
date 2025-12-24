// admin.dto.ts

import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// Mantener el viejo por si lo usás en otro lado
export class AdministradorDto {
  userEmail: string;
}
