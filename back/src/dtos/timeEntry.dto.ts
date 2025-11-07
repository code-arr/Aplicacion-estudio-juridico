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

export enum TrackableType {
  DOCUMENT = 'Document',
  AUDIENCE = 'Audience',
  MEETING = 'Meeting',
  PROCESS = 'Process',
  CLIENT = 'Client',
}

export enum PauseReason {
  SWITCH = 'Switch',
  IDLE = 'Idle',
  CLOSE = 'Close',
  LOGOUT = 'Logout',
  SUSPEND = 'Suspend',
}
export class CreateTimeEntryDto {
  @IsUUID() id!: string;
  @IsUUID() lawyerId!: string;

  @IsEnum(TrackableType) trackableType!: TrackableType;
  @IsString() trackableId!: string;

  @IsISO8601() startedAtUTC!: string; // ISO string
  @IsISO8601() endedAtUTC!: string; // ISO string

  @IsInt() durationSec!: number;
  @IsEnum(PauseReason) pauseReason!: PauseReason;

  @IsString() dayKey?: string | null; // Formato 'YYYY-MM-DD', para consultas y reportes diarios

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientItemId?: string;

  @IsOptional() @IsString() appVersion?: string | null;
}
