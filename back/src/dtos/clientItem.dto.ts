import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Currency } from 'src/entities/clientItem.entity';

export class ClientItemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  hourlyRateOverride?: string | null;

  @IsOptional()
  currencyOverride?: Currency | null;

  @IsOptional()
  @IsString()
  itemTypeId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsNotEmpty()
  @IsString()
  clientId: string;
}
