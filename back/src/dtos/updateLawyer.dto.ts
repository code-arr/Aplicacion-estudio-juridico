import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { lawyerType, seniorityLevel } from '../entities/lawyer.entity';

export class UpdateLawyerDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsOptional()
  firstName?: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @IsOptional()
  lastName?: string;

  @IsString({ message: 'La dirección debe ser una cadena de texto.' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'El RUT debe ser una cadena de texto.' })
  @IsOptional()
  rut?: string;

  @IsEnum(lawyerType, { message: 'Tipo de abogado inválido.' })
  @IsOptional()
  type?: lawyerType;

  @IsEnum(seniorityLevel, { message: 'Nivel de seniority inválido.' })
  @IsOptional()
  seniorityLevel?: seniorityLevel;

  @IsInt({ message: 'WorkedHours debe ser un número entero.' })
  @Min(0, { message: 'WorkedHours no puede ser negativo.' })
  @IsOptional()
  workedHours?: number;
}