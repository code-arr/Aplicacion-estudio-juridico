// src/time-entries/dto/query-time-entries.dto.ts
import { IsOptional, IsUUID, IsISO8601, IsString } from 'class-validator';

export class QueryTimeEntriesDto {
  @IsUUID() lawyerId!: string;


  @IsOptional() @IsISO8601() fromUTC?: string; // rango (inicio inclusive)
  @IsOptional() @IsISO8601() toUTC?: string; // rango (fin exclusivo)
}
