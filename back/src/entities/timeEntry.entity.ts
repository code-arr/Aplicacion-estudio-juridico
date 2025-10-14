// src/time-entries/entities/timeEntry.entity.ts
import { IsUUID } from 'class-validator';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
export enum TrackableType {
  LawyerApp = 'LawyerApp',
  Client = 'Client',
  Document = 'Document',
  Audience = 'Audience',
  Process = 'Process',
  Meeting = 'Meeting',
}

export enum PauseReason {
  switch = 'switch',
  close = 'close',
  idle = 'idle',
  logout = 'logout',
  suspend = 'suspend',
}

// Índices individuales
@Index('idx_time_entry_lawyer', ['lawyerId'])
@Index('idx_time_entry_trackableId', ['trackableId'])
// Índice compuesto: (lawyerId, dayKey)
@Entity({ name: 'time_entries' })
export class TimeEntry {
  // id generado en el cliente (UUID string). Idempotencia por este campo.
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'uuid' })
  lawyerId!: string;

  @Column({
    type: 'enum',
    enum: TrackableType,
  })
  trackableType!: TrackableType;

  @Column({ type: 'text' })
  trackableId!: string;

  // Fechas en UTC (recomendado timestamptz en Postgres)
  @Column({ type: 'timestamptz' })
  startedAtUTC!: Date;

  @Column({ type: 'timestamptz' })
  endedAtUTC!: Date;

  @Column({ type: 'int' })
  durationSec!: number;

  @Column({
    type: 'enum',
    enum: PauseReason,
  })
  pauseReason!: PauseReason;

  @Column({ type: 'text', nullable: true })
  appVersion?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
