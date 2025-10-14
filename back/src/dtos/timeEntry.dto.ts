// src/time-entries/dto/create-time-entry.dto.ts
import {
  IsUUID,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PauseReason, TrackableType } from '../entities/timeEntry.entity';

export class CreateTimeEntryDto {
  @IsUUID() id!: string;
  @IsUUID() lawyerId!: string;

  @IsEnum(TrackableType) trackableType!: TrackableType;
  @IsString() trackableId!: string;

  @IsISO8601() startedAtUTC!: string; // ISO string
  @IsISO8601() endedAtUTC!: string; // ISO string

  @IsInt() durationSec!: number;
  @IsEnum(PauseReason) pauseReason!: PauseReason;

  @IsOptional() @IsString() appVersion?: string | null;
}
