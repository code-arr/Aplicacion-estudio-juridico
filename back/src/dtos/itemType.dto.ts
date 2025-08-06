import { IsNotEmpty, IsString } from 'class-validator';

export class ItemTypeDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
