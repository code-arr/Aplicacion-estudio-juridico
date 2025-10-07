import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  Length,
} from 'class-validator';
import { clientType } from 'src/entities/client.entity';


export class CreateClienteDto {
  
  type : clientType.FISICA | clientType.JURIDICA;

  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsOptional()
  firstName: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @IsOptional()
  lastName: string;

  @IsEmail(
    {},
    {
      message: 'El correo electrónico debe ser una dirección de email válida.',
    },
  )
  @IsOptional()
  email: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' }) // Se puede usar IsPhoneNumber si se necesita validación de formato más estricta
  @IsNotEmpty({ message: 'El número de teléfono no puede estar vacío.' })
  // @IsPhoneNumber('AR', { message: 'El número de teléfono debe ser válido para Argentina.' }) // Ejemplo para Argentina
  phone: string;

  @IsString({ message: 'La dirección debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La dirección no puede estar vacía.' })
  
  address: string; // Usar '?' para indicar que es opcional en TypeScript

  @IsString({ message: 'El RUT/DNI debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El RUT/DNI no puede estar vacío.' })
  @Length(10, 12, {
    message:
      'El RUT/DNI debe tener entre 10 y 12 caracteres (incluyendo puntos y guión).',
  }) // Ajusta el Length según el formato exacto de tu RUT/DNI
  rut: string;

  @IsString({ message: 'El nombre de la empresa debe ser una cadena de texto.' })
  @IsOptional()
  companyName : string;

  @IsString({ message: 'El representante legal debe ser una cadena de texto.' })
  @IsOptional()
  legalRepresentative : string;




}
