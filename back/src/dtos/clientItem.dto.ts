import { IsNotEmpty, IsString } from 'class-validator';

export class ClientItemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description?: string;
}
