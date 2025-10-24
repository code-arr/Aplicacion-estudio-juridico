import { IsString, IsEmail, IsOptional, Length } from 'class-validator';
import { clientType } from 'src/entities/client.entity';

export class UpdateClienteDto {
  @IsOptional()
  type?: clientType.FISICA | clientType.JURIDICA;

  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsOptional()
  firstName?: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @IsOptional()
  lastName?: string;

  @IsEmail(
    {},
    {
      message: 'El correo electrónico debe ser una dirección de email válida.',
    },
  )
  @IsOptional()
  email?: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'La dirección debe ser una cadena de texto.' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'El RUT/DNI debe ser una cadena de texto.' })
  @Length(10, 12, {
    message: 'El RUT/DNI debe tener entre 10 y 12 caracteres.',
  })
  @IsOptional()
  rut?: string;

  @IsString({
    message: 'El nombre de la empresa debe ser una cadena de texto.',
  })
  @IsOptional()
  companyName?: string;

  @IsString({ message: 'El representante legal debe ser una cadena de texto.' })
  @IsOptional()
  legalRepresentative?: string;
}
