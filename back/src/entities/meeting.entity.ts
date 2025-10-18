import { IsUUID } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ClientItem } from './clientItem.entity';
import { Client } from './client.entity';
import * as moment from 'moment-timezone';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string = uuid();

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', nullable: true })
  durationSec: number; // Duración de la reunión (ej. 1 hora, 30 minutos, etc.)

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  startAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  link: string;

  @Column({
    type: 'enum',
    enum: ['google-meet', 'in-person'],
    default: 'google-meet',
  })
  type: 'google-meet' | 'in-person';

  @Column({ type: 'json', nullable: true })
  participants: [{ name: string; email: string }]; // Lista de participantes (nombre y correo electrónico)

  @Column({ type: 'varchar', length: 255, nullable: true })
  eventId: string; // ID del evento en Google Calendar

  @Column({ type: 'varchar', nullable: true })
  location: string; // Ubicación física si es una reunión en persona
  @Column({
    type: 'enum',
    enum: ['scheduled', 'completed'],
    default: 'scheduled',
  })
  status: 'scheduled' | 'completed' | 'canceled';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @ManyToOne(() => Client, (client) => client.meetings)
  client: Client;

  @ManyToOne(() => ClientItem, (clientItem) => clientItem.meetings)
  clientItem: ClientItem;
}
