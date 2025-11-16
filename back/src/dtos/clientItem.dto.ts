import { IsNotEmpty, IsString } from 'class-validator';
import { Currency } from 'src/entities/clientItem.entity';

export class ClientItemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description?: string;

  @IsString()
  hourlyRateOverride?: string | null;

  currencyOverride?: Currency | null;

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
