// src/abogado/dto/create-abogado.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsInt, MinLength, MaxLength, IsOptional, Min } from 'class-validator';
import { tipoAbogado, SeniorityLevel } from 'src/entities/abogado.entity';

export class AbogadoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  apellido: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  direccion: string;

  @IsString()
  @IsNotEmpty()
  // Considera usar una validación más específica para números de teléfono si tienes un formato particular
  // @IsPhoneNumber('ZZ') // 'ZZ' para validación genérica internacional o el código de país
  @MinLength(10)
  @MaxLength(15)
  telefono: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  rut: string; // O considera un formato de validación regex para RUT

  @IsEnum(tipoAbogado, { message: 'El tipo de abogado no es válido.' })
  @IsOptional() // Si no es obligatorio especificar al crear
  tipoAbogado: tipoAbogado.CRIMINAL | tipoAbogado.CIVIL | tipoAbogado.FAMILIAR;

  @IsEnum(SeniorityLevel, { message: 'El nivel de seniority no es válido.' })
  @IsNotEmpty() // Asumo que el seniority es obligatorio al crear
  seniorityLevel: SeniorityLevel.JUNIOR | SeniorityLevel.MID | SeniorityLevel.SENIOR;

  @IsInt()
  @Min(0)
  @IsOptional()
  horasTrabajadas?: number; // Es opcional ya que tiene un valor por defecto en la entidad

  userEmail : string; // Asumiendo que este es el email del usuario asociado al abogado
}