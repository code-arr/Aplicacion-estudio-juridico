// src/abogado/dto/create-abogado.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsInt, MinLength, MaxLength, IsOptional, Min } from 'class-validator';
import { lawyerType, seniorityLevel } from 'src/entities/lawyer.entity';

export class AbogadoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  address: string;

  @IsString()
  @IsNotEmpty()
  // Considera usar una validación más específica para números de teléfono si tienes un formato particular
  // @IsPhoneNumber('ZZ') // 'ZZ' para validación genérica internacional o el código de país
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  rut: string; // O considera un formato de validación regex para RUT

  @IsEnum(lawyerType, { message: 'El tipo de abogado no es válido.' })
  @IsOptional() // Si no es obligatorio especificar al crear
  type: lawyerType.CRIMINAL | lawyerType.CIVIL | lawyerType.FAMILIAR;

  @IsEnum(seniorityLevel, { message: 'El nivel de seniority no es válido.' })
  @IsOptional() // Asumo que el seniority es obligatorio al crear
  seniorityLevel: seniorityLevel.JUNIOR | seniorityLevel.MID | seniorityLevel.SENIOR;

  @IsInt()
  @Min(0)
  @IsOptional()
  workedHours?: number; // Es opcional ya que tiene un valor por defecto en la entidad

  @IsOptional()
  userEmail : string; // Asumiendo que este es el email del usuario asociado al abogado
}