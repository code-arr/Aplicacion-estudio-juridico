import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Currency, status } from 'src/entities/clientItem.entity';

export class UpdateClientItemDto {
  @IsString({ message: 'El título debe ser una cadena de texto.' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsOptional()
  description?: string;

  @IsEnum(status, { message: 'El estado debe ser open, on_hold o closed.' })
  @IsOptional()
  status?: status;

  @IsOptional()
  hourlyRateOverride?: string | null;

  @IsOptional()
  currencyOverride?: Currency | null;
}
