import { IsNotEmpty, IsString } from 'class-validator';

export class ClientItemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description?: string;

  @IsString()
  itemTypeId?: string;

  @IsString()
  categoryId?: string;

  @IsString()
  sectionId?: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;
}
