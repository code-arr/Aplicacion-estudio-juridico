import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

// Si tienes DTOs para Abogado, Cliente, Documento, Reunion, deberías importarlos
// import { AbogadoDto } from './abogado.dto';
// import { ClienteDto } from './cliente.dto';
// import { DocumentoDto } from './documento.dto';
// import { ReunionDto } from './reunion.dto';

export class CasoDto {
  @IsUUID()
  @IsOptional() // El ID es opcional al crear un nuevo caso, se genera automáticamente
  id?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  

}